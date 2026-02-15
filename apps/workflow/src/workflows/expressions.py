import re
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

EXPRESSION_PATTERN = re.compile(r'\$\{\{\s*(.+?)\s*\}\}')


class ExpressionEvaluator:
    def __init__(self, context: dict[str, Any]):
        self.context = context

    def evaluate(self, template: Any) -> Any:
        if isinstance(template, dict):
            return {k: self.evaluate(v) for k, v in template.items()}
        if isinstance(template, list):
            return [self.evaluate(item) for item in template]
        if not isinstance(template, str):
            return template

        stripped = template.strip()
        m = EXPRESSION_PATTERN.fullmatch(stripped)
        if m:
            try:
                return self._eval_expression(m.group(1).strip())
            except Exception as e:
                logger.warning(f"Failed to evaluate expression '{m.group(1).strip()}': {e}")
                return template

        def replace_expr(match: re.Match) -> str:
            expr = match.group(1).strip()
            try:
                result = self._eval_expression(expr)
                if isinstance(result, (dict, list)):
                    return json.dumps(result)
                return str(result) if result is not None else ""
            except Exception as e:
                logger.warning(f"Failed to evaluate expression '{expr}': {e}")
                return match.group(0)

        return EXPRESSION_PATTERN.sub(replace_expr, template)

    def evaluate_condition(self, condition: str) -> bool:
        if not condition:
            return True

        condition = condition.strip()
        if condition.startswith("${{") and condition.endswith("}}"):
            condition = condition[3:-2].strip()

        try:
            result = self._eval_expression(condition)
            return bool(result)
        except Exception as e:
            logger.warning(f"Failed to evaluate condition '{condition}': {e}")
            return False

    def _eval_expression(self, expr: str) -> Any:
        expr = expr.strip()

        if " ? " in expr and " : " in expr:
            return self._eval_ternary(expr)

        if " ?? " in expr:
            left, right = expr.split(" ?? ", 1)
            left_val = self._eval_expression(left.strip())
            if left_val is None:
                return self._eval_expression(right.strip())
            return left_val

        if " && " in expr:
            parts = self._split_respecting_quotes(expr, " && ")
            return all(self._eval_expression(p.strip()) for p in parts)

        if " || " in expr:
            parts = self._split_respecting_quotes(expr, " || ")
            return any(self._eval_expression(p.strip()) for p in parts)

        for op in ["==", "!=", "<=", ">=", "<", ">"]:
            if op in expr:
                idx = expr.index(op)
                left = expr[:idx].strip()
                right = expr[idx + len(op):].strip()
                left_val = self._eval_value(left)
                right_val = self._eval_value(right)
                if op == "==":
                    return left_val == right_val
                elif op == "!=":
                    return left_val != right_val
                elif op == "<=":
                    return self._compare(left_val, right_val, op)
                elif op == ">=":
                    return self._compare(left_val, right_val, op)
                elif op == "<":
                    return self._compare(left_val, right_val, op)
                elif op == ">":
                    return self._compare(left_val, right_val, op)

        if " in " in expr:
            left, right = expr.split(" in ", 1)
            left_val = self._eval_value(left.strip())
            right_val = self._eval_value(right.strip())
            if isinstance(right_val, (list, str, dict)):
                return left_val in right_val
            return False

        if expr.startswith("!"):
            inner = expr[1:].strip()
            return not self._eval_expression(inner)

        for op in ["+", "-", "*", "/"]:
            parts = self._split_arithmetic(expr, op)
            if parts:
                left_val = self._eval_value(parts[0].strip())
                right_val = self._eval_value(parts[1].strip())
                return self._arithmetic(left_val, right_val, op)

        return self._eval_value(expr)

    def _eval_ternary(self, expr: str) -> Any:
        q_idx = expr.index(" ? ")
        condition_str = expr[:q_idx].strip()
        rest = expr[q_idx + 3:]

        depth = 0
        colon_idx = -1
        for i, ch in enumerate(rest):
            if ch == '?' and i > 0 and rest[i-1] == ' ':
                depth += 1
            elif ch == ':' and i > 0 and rest[i-1] == ' ' and depth == 0:
                colon_idx = i
                break
            elif ch == ':' and i > 0 and rest[i-1] == ' ':
                depth -= 1

        if colon_idx == -1:
            colon_idx = rest.rindex(" : ")
            true_val = rest[:colon_idx].strip()
            false_val = rest[colon_idx + 3:].strip()
        else:
            true_val = rest[:colon_idx].strip()
            false_val = rest[colon_idx + 2:].strip()

        cond = self._eval_expression(condition_str)
        if cond:
            return self._eval_expression(true_val)
        return self._eval_expression(false_val)

    def _eval_value(self, expr: str) -> Any:
        expr = expr.strip()

        func_match = re.match(r'^(\w+)\((.+)\)$', expr)
        if func_match:
            func_name = func_match.group(1)
            args_str = func_match.group(2)
            return self._call_function(func_name, args_str)

        return self._parse_literal_or_path(expr)

    def _call_function(self, name: str, args_str: str) -> Any:
        args = self._parse_func_args(args_str)

        if name == "length" or name == "len":
            if len(args) != 1:
                raise ValueError(f"length() takes 1 argument, got {len(args)}")
            val = self._eval_value(args[0])
            if isinstance(val, (str, list, dict)):
                return len(val)
            return 0

        if name == "join":
            if len(args) < 1 or len(args) > 2:
                raise ValueError(f"join() takes 1-2 arguments, got {len(args)}")
            val = self._eval_value(args[0])
            sep = self._eval_value(args[1]) if len(args) > 1 else ", "
            if isinstance(val, list):
                return str(sep).join(str(item) for item in val)
            return str(val)

        if name == "contains":
            if len(args) != 2:
                raise ValueError(f"contains() takes 2 arguments, got {len(args)}")
            haystack = self._eval_value(args[0])
            needle = self._eval_value(args[1])
            if isinstance(haystack, str):
                return str(needle) in haystack
            if isinstance(haystack, list):
                return needle in haystack
            return False

        if name == "toJSON":
            if len(args) != 1:
                raise ValueError(f"toJSON() takes 1 argument, got {len(args)}")
            val = self._eval_value(args[0])
            return json.dumps(val)

        if name == "fromJSON":
            if len(args) != 1:
                raise ValueError(f"fromJSON() takes 1 argument, got {len(args)}")
            val = self._eval_value(args[0])
            if isinstance(val, str):
                return json.loads(val)
            return val

        if name == "toUpperCase" or name == "upper":
            if len(args) != 1:
                raise ValueError(f"{name}() takes 1 argument, got {len(args)}")
            val = self._eval_value(args[0])
            return str(val).upper()

        if name == "toLowerCase" or name == "lower":
            if len(args) != 1:
                raise ValueError(f"{name}() takes 1 argument, got {len(args)}")
            val = self._eval_value(args[0])
            return str(val).lower()

        if name == "startsWith":
            if len(args) != 2:
                raise ValueError(f"startsWith() takes 2 arguments, got {len(args)}")
            val = str(self._eval_value(args[0]))
            prefix = str(self._eval_value(args[1]))
            return val.startswith(prefix)

        if name == "endsWith":
            if len(args) != 2:
                raise ValueError(f"endsWith() takes 2 arguments, got {len(args)}")
            val = str(self._eval_value(args[0]))
            suffix = str(self._eval_value(args[1]))
            return val.endswith(suffix)

        raise ValueError(f"Unknown function: {name}")

    def _parse_func_args(self, args_str: str) -> list[str]:
        args: list[str] = []
        depth = 0
        current = ""
        in_quote = False
        quote_char = ""

        for ch in args_str:
            if ch in ("'", '"') and not in_quote:
                in_quote = True
                quote_char = ch
                current += ch
            elif ch == quote_char and in_quote:
                in_quote = False
                current += ch
            elif ch == "(" and not in_quote:
                depth += 1
                current += ch
            elif ch == ")" and not in_quote:
                depth -= 1
                current += ch
            elif ch == "," and depth == 0 and not in_quote:
                args.append(current.strip())
                current = ""
            else:
                current += ch

        if current.strip():
            args.append(current.strip())

        return args

    def _compare(self, left: Any, right: Any, op: str) -> bool:
        try:
            l = float(left) if not isinstance(left, (int, float)) else left
            r = float(right) if not isinstance(right, (int, float)) else right
            if op == "<":
                return l < r
            elif op == ">":
                return l > r
            elif op == "<=":
                return l <= r
            elif op == ">=":
                return l >= r
        except (ValueError, TypeError):
            return False
        return False

    def _arithmetic(self, left: Any, right: Any, op: str) -> Any:
        if op == "+" and isinstance(left, str) and isinstance(right, str):
            return left + right

        try:
            l = float(left) if not isinstance(left, (int, float)) else left
            r = float(right) if not isinstance(right, (int, float)) else right
            if op == "+":
                result = l + r
            elif op == "-":
                result = l - r
            elif op == "*":
                result = l * r
            elif op == "/":
                if r == 0:
                    raise ValueError("Division by zero")
                result = l / r
            else:
                raise ValueError(f"Unknown operator: {op}")

            if isinstance(result, float) and result == int(result):
                return int(result)
            return result
        except (ValueError, TypeError) as e:
            raise ValueError(f"Cannot perform arithmetic {left} {op} {right}: {e}")

    def _split_arithmetic(self, expr: str, op: str) -> list[str] | None:
        if op not in expr:
            return None

        if op in ("+", "-"):
            depth = 0
            for i in range(len(expr) - 1, 0, -1):
                ch = expr[i]
                if ch == ")":
                    depth += 1
                elif ch == "(":
                    depth -= 1
                elif (
                    ch == op
                    and depth == 0
                    and i > 0
                    and expr[i - 1] == " "
                    and i + 1 < len(expr)
                    and expr[i + 1] == " "
                ):
                    left = expr[:i].strip()
                    right = expr[i + 1:].strip()
                    if left and right:
                        return [left, right]
        elif op in ("*", "/"):
            depth = 0
            for i in range(len(expr) - 1, 0, -1):
                ch = expr[i]
                if ch == ")":
                    depth += 1
                elif ch == "(":
                    depth -= 1
                elif ch == op and depth == 0:
                    left = expr[:i].strip()
                    right = expr[i + 1:].strip()
                    if left and right:
                        return [left, right]

        return None

    def _split_respecting_quotes(self, expr: str, separator: str) -> list[str]:
        parts: list[str] = []
        depth = 0
        current = ""
        in_quote = False
        quote_char = ""
        i = 0

        while i < len(expr):
            ch = expr[i]

            if ch in ("'", '"') and not in_quote:
                in_quote = True
                quote_char = ch
                current += ch
            elif ch == quote_char and in_quote:
                in_quote = False
                current += ch
            elif expr[i:i + len(separator)] == separator and depth == 0 and not in_quote:
                parts.append(current)
                current = ""
                i += len(separator)
                continue
            else:
                current += ch

            i += 1

        if current:
            parts.append(current)

        return parts

    def _parse_literal_or_path(self, value: str) -> Any:
        value = value.strip()

        if value.startswith("'") and value.endswith("'"):
            return value[1:-1]
        if value.startswith('"') and value.endswith('"'):
            return value[1:-1]

        if value.lower() == "true":
            return True
        if value.lower() == "false":
            return False
        if value.lower() == "null" or value.lower() == "none":
            return None

        try:
            return int(value)
        except ValueError:
            pass

        try:
            return float(value)
        except ValueError:
            pass

        return self._resolve_path(value)

    def _resolve_path(self, path: str) -> Any:
        path = path.strip()

        parts = path.replace("[", ".").replace("]", "").split(".")
        current = self.context

        for part in parts:
            if not part:
                continue
            if isinstance(current, dict):
                current = current.get(part)
            elif isinstance(current, list):
                try:
                    current = current[int(part)]
                except (ValueError, IndexError):
                    return None
            else:
                return None

            if current is None:
                return None

        return current
