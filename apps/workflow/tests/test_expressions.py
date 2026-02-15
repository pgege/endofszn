import json
import pytest
from src.workflows.expressions import ExpressionEvaluator


@pytest.fixture
def ctx():
    return {
        "trigger": {
            "message": "Hello world",
            "user": {"name": "Alice", "role": "admin"},
        },
        "steps": {
            "step1": {
                "output": {"score": 85, "tags": ["a", "b"]},
                "status": "success",
            },
            "step2": {
                "output": "Step 2 result",
                "status": "failure",
            },
            "handle-product": {
                "output": "Product info",
                "status": "success",
            },
            "text-step": {
                "output": "Simple text result",
                "status": "success",
            },
        },
        "context": {
            "store_name": "Test Store",
            "items": ["x", "y", "z"],
        },
        "variables": {
            "max_retries": 3,
            "mode": "production",
        },
    }


class TestBasicEvaluation:
    def test_plain_string(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("no expressions here") == "no expressions here"

    def test_simple_path(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("${{ trigger.message }}") == "Hello world"

    def test_nested_path(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("${{ trigger.user.name }}") == "Alice"

    def test_step_output_string(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("${{ steps.text-step.output }}") == "Simple text result"

    def test_step_output_dict(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("${{ steps.step1.output }}")
        assert isinstance(result, dict)
        assert result == {"score": 85, "tags": ["a", "b"]}

    def test_context_path(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("${{ context.store_name }}") == "Test Store"

    def test_variables_path(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("${{ variables.max_retries }}") == 3

    def test_interpolation_in_string(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("Hello ${{ trigger.user.name }}, welcome to ${{ context.store_name }}")
        assert result == "Hello Alice, welcome to Test Store"

    def test_missing_path_returns_none(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("${{ trigger.nonexistent }}") is None

    def test_dict_evaluation(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate({
            "name": "${{ trigger.user.name }}",
            "store": "${{ context.store_name }}",
        })
        assert result == {"name": "Alice", "store": "Test Store"}

    def test_list_evaluation(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate(["${{ trigger.message }}", "static"])
        assert result == ["Hello world", "static"]

    def test_non_string_passthrough(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate(42) == 42
        assert ev.evaluate(True) is True

    def test_dict_output_preserved(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("${{ steps.step1.output }}")
        assert isinstance(result, dict)
        assert result == {"score": 85, "tags": ["a", "b"]}

    def test_dict_output_nested_field(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("${{ steps.step1.output.score }}")
        assert result == 85


class TestConditions:
    def test_true_condition(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ steps.step1.status == 'success' }}") is True

    def test_false_condition(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ steps.step1.status == 'failure' }}") is False

    def test_not_equal(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ steps.step1.status != 'failure' }}") is True

    def test_empty_condition_is_true(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("") is True
        assert ev.evaluate_condition(None) is True

    def test_truthy_value(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ trigger.message }}") is True

    def test_falsy_value(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ trigger.nonexistent }}") is False

    def test_and_operator(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ steps.step1.status == 'success' && trigger.message }}") is True
        assert ev.evaluate_condition("${{ steps.step1.status == 'failure' && trigger.message }}") is False

    def test_or_operator(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ steps.step1.status == 'failure' || trigger.message }}") is True

    def test_not_operator(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ !trigger.nonexistent }}") is True


class TestComparisons:
    def test_numeric_less_than(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ variables.max_retries < 5 }}") is True
        assert ev.evaluate_condition("${{ variables.max_retries < 2 }}") is False

    def test_numeric_greater_than(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ variables.max_retries > 1 }}") is True

    def test_numeric_lte(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ variables.max_retries <= 3 }}") is True

    def test_numeric_gte(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ variables.max_retries >= 3 }}") is True

    def test_in_operator_list(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ 'x' in context.items }}") is True
        assert ev.evaluate_condition("${{ 'w' in context.items }}") is False

    def test_in_operator_string(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ 'Hello' in trigger.message }}") is True


class TestArithmetic:
    def test_addition(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("${{ 2 + 3 }}") == 5

    def test_subtraction(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("${{ 10 - 4 }}") == 6

    def test_multiplication(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("${{ 3 * 7 }}") == 21

    def test_division(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("${{ 10 / 2 }}") == 5

    def test_string_concatenation(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("'hello' + ' world'")
        assert result == "hello world"


class TestTernary:
    def test_true_branch(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("steps.step1.status == 'success' ? 'yes' : 'no'")
        assert result == "yes"

    def test_false_branch(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("steps.step1.status == 'failure' ? 'yes' : 'no'")
        assert result == "no"


class TestNullishCoalescing:
    def test_non_null_returns_left(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("trigger.message ?? 'default'")
        assert result == "Hello world"

    def test_null_returns_right(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("trigger.nonexistent ?? 'fallback'")
        assert result == "fallback"


class TestFunctions:
    def test_length_string(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("length(trigger.message)")
        assert result == 11

    def test_length_list(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("length(context.items)")
        assert result == 3

    def test_join(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("join(context.items, ', ')")
        assert result == "x, y, z"

    def test_join_default_separator(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("join(context.items)")
        assert result == "x, y, z"

    def test_contains_true(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("contains(trigger.message, 'world')")
        assert result is True

    def test_contains_false(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("contains(trigger.message, 'nope')")
        assert result is False

    def test_contains_list(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("contains(context.items, 'x')")
        assert result is True

    def test_to_json(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("toJSON(context.items)")
        assert json.loads(result) == ["x", "y", "z"]

    def test_from_json(self, ctx):
        ev = ExpressionEvaluator(ctx)
        ctx["variables"]["json_str"] = '{"a": 1}'
        result = ev._eval_expression("fromJSON(variables.json_str)")
        assert result == {"a": 1}

    def test_upper(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("upper(trigger.user.name)")
        assert result == "ALICE"

    def test_lower(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("lower(trigger.user.name)")
        assert result == "alice"

    def test_starts_with(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev._eval_expression("startsWith(trigger.message, 'Hello')") is True
        assert ev._eval_expression("startsWith(trigger.message, 'World')") is False

    def test_ends_with(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev._eval_expression("endsWith(trigger.message, 'world')") is True
        assert ev._eval_expression("endsWith(trigger.message, 'Hello')") is False

    def test_unknown_function_raises(self, ctx):
        ev = ExpressionEvaluator(ctx)
        with pytest.raises(ValueError, match="Unknown function"):
            ev._eval_expression("unknownFunc('test')")


class TestLiterals:
    def test_string_single_quotes(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev._eval_expression("'hello'") == "hello"

    def test_string_double_quotes(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev._eval_expression('"hello"') == "hello"

    def test_boolean_true(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev._eval_expression("true") is True

    def test_boolean_false(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev._eval_expression("false") is False

    def test_null(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev._eval_expression("null") is None

    def test_integer(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev._eval_expression("42") == 42

    def test_float(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev._eval_expression("3.14") == 3.14


class TestPathResolution:
    def test_array_index(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("context.items[0]")
        assert result == "x"

    def test_array_index_last(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("context.items[2]")
        assert result == "z"

    def test_array_out_of_bounds(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("context.items[99]")
        assert result is None

    def test_output_nested_field(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("steps.step1.output.score")
        assert result == 85

    def test_output_nested_array_index(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev._eval_expression("steps.step1.output.tags[0]")
        assert result == "a"


class TestHyphenatedIds:
    def test_hyphenated_step_output(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("${{ steps.handle-product.output }}") == "Product info"

    def test_hyphenated_step_status(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("${{ steps.handle-product.status }}") == "success"

    def test_hyphenated_in_condition(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate_condition("${{ steps.handle-product.status == 'success' }}") is True

    def test_hyphenated_in_template(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("Result: ${{ steps.handle-product.output }}")
        assert result == "Result: Product info"

    def test_arithmetic_still_works(self, ctx):
        ev = ExpressionEvaluator(ctx)
        assert ev.evaluate("${{ 10 - 3 }}") == 7


class TestEdgeCases:
    def test_invalid_expression_returns_none(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("${{ unknownRoot.path }}")
        assert result is None

    def test_division_by_zero(self, ctx):
        ev = ExpressionEvaluator(ctx)
        with pytest.raises(ValueError, match="Division by zero"):
            ev._eval_expression("10 / 0")

    def test_multiple_expressions_in_template(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("User: ${{ trigger.user.name }} (${{ trigger.user.role }})")
        assert result == "User: Alice (admin)"


class TestTypePreservingEvaluation:
    def test_pure_string_expression_returns_string(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("${{ trigger.message }}")
        assert result == "Hello world"
        assert isinstance(result, str)

    def test_pure_dict_expression_returns_dict(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("${{ steps.step1.output }}")
        assert isinstance(result, dict)
        assert result == {"score": 85, "tags": ["a", "b"]}

    def test_pure_list_expression_returns_list(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("${{ context.items }}")
        assert isinstance(result, list)
        assert result == ["x", "y", "z"]

    def test_pure_int_expression_returns_int(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("${{ variables.max_retries }}")
        assert result == 3
        assert isinstance(result, int)

    def test_mixed_template_stringifies(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("Score: ${{ steps.step1.output.score }}")
        assert result == "Score: 85"
        assert isinstance(result, str)

    def test_dict_in_mixed_template_becomes_json(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("Data: ${{ steps.step1.output }}")
        assert isinstance(result, str)
        assert "score" in result

    def test_dict_output_with_expression_values(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate({
            "score": "${{ steps.step1.output.score }}",
            "name": "${{ trigger.user.name }}",
        })
        assert result == {"score": 85, "name": "Alice"}

    def test_pure_expression_with_whitespace(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("  ${{ steps.step1.output }}  ")
        assert isinstance(result, dict)

    def test_boolean_expression_preserved(self, ctx):
        ev = ExpressionEvaluator(ctx)
        result = ev.evaluate("${{ true }}")
        assert result is True
