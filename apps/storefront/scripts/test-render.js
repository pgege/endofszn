#!/usr/bin/env node

/**
 * Headless browser test to verify the application renders without errors
 * This catches runtime errors that TypeScript/build process might miss
 * 
 * IMPORTANT: The dev server must be running (yarn dev) before running this test
 * 
 * Usage:
 *   yarn test:render              # Test root route only
 *   yarn test:render /blog         # Test specific route
 *   yarn test:render / /blog /dashboard  # Test multiple routes
 */

const puppeteer = require('puppeteer');
const waitOn = require('wait-on');

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;
const TIMEOUT = 30000; // 30 seconds

// Get routes from command line arguments, default to root only
const args = process.argv.slice(2);
const routesToTest = args.length > 0 ? args : ['/'];

let browser = null;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testRoute(page, route) {
  const errors = [];
  const warnings = [];
  const consoleMessages = [];
  const testUrl = `${URL}${route}`;
  
  log(`\nTesting route: ${route}`, 'blue');
  log(`Full URL: ${testUrl}`, 'dim');
  
  try {
    // Clear previous listeners
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.removeAllListeners('requestfailed');
    page.removeAllListeners('response');
    
    // Set up error detection before navigation
    
    // Capture ALL console messages
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      // Store all console messages
      consoleMessages.push({ type, text });
      
      if (type === 'error') {
        errors.push({
          source: 'console',
          message: text
        });
        log(`  Console Error: ${text}`, 'red');
      } else if (type === 'warning' && !text.includes('DevTools')) {
        warnings.push({
          source: 'console',
          message: text
        });
        // Only show React-related warnings
        if (text.includes('React') || text.includes('Hook') || text.includes('prop')) {
          log(`  Console Warning: ${text}`, 'yellow');
        }
      }
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', (error) => {
      const errorMsg = error.toString();
      const stack = error.stack || '';
      
      errors.push({
        source: 'runtime',
        message: errorMsg,
        stack: stack
      });
      
      log(`  Runtime Error: ${errorMsg}`, 'red');
      if (stack && process.env.DEBUG) {
        log(`  Stack: ${stack}`, 'dim');
      }
    });
    
    // Inject unhandled promise rejection detection
    await page.evaluateOnNewDocument(() => {
      window.addEventListener('unhandledrejection', (event) => {
        console.error(`Unhandled Promise Rejection: ${event.reason}`);
      });
      
      // Override console.error to ensure we catch everything
      const originalError = console.error;
      console.error = function(...args) {
        originalError.apply(console, args);
      };
    });

    // Navigate to the route
    let response;
    try {
      response = await page.goto(testUrl, {
        waitUntil: 'networkidle2',
        timeout: TIMEOUT
      });
    } catch (navError) {
      errors.push({
        source: 'navigation',
        message: `Failed to navigate: ${navError.message}`
      });
      log(`  Navigation Error: ${navError.message}`, 'red');
      return { route, errors, warnings, consoleMessages };
    }

    const status = response.status();
    
    // Check HTTP status
    if (status === 404) {
      log(`  HTTP Status: 404 (Not Found)`, 'yellow');
      warnings.push({
        source: 'http',
        message: `Route returned 404`
      });
    } else if (status >= 500) {
      log(`  HTTP Status: ${status} (Server Error)`, 'red');
      errors.push({
        source: 'http',
        message: `Server error: HTTP ${status}`,
        details: 'Application crashed during rendering'
      });
      
      // Try to extract error message from the response
      try {
        const pageText = await page.evaluate(() => document.body?.textContent || '');
        
        // Extract specific error patterns if they exist
        if (pageText.includes('Objects are not valid as a React child')) {
          const match = pageText.match(/Objects are not valid as a React child \(found: ([^)]+)\)/);
          if (match) {
            errors.push({
              source: 'react',
              message: `React child error: ${match[0]}`,
              hint: 'Format Date objects and stringify Objects before rendering'
            });
          }
        }
        
        // Look for error digest (Next.js error ID)
        const digestMatch = pageText.match(/digest:\s*['"]([^'"]+)['"]/);
        if (digestMatch) {
          log(`  Error digest: ${digestMatch[1]}`, 'dim');
        }
      } catch (e) {
        // Couldn't extract error details
      }
    } else if (status >= 400) {
      log(`  HTTP Status: ${status} (Client Error)`, 'yellow');
      warnings.push({
        source: 'http',
        message: `Client error: HTTP ${status}`
      });
    } else {
      log(`  HTTP Status: ${status} (OK)`, 'green');
    }

    // Only check for Next.js error overlay if page loaded
    if (status < 500) {
      // Wait a bit for client-side rendering
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        // Check for Next.js error overlay
        const hasErrorOverlay = await page.evaluate(() => {
          const selectors = [
            '[data-nextjs-error]',
            '[data-nextjs-dialog]',
            '#__next-build-error',
            '.nextjs-container-errors-header',
            '[class*="error-overlay"]'
          ];
          
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
              return {
                found: true,
                text: element.textContent || 'Error overlay detected',
                selector: selector
              };
            }
          }
          
          // Check if page title indicates error
          if (document.title.includes('Error') || document.title.includes('500')) {
            return {
              found: true,
              text: document.title,
              selector: 'title'
            };
          }
          
          return { found: false };
        });

        if (hasErrorOverlay.found) {
          errors.push({
            source: 'nextjs',
            message: hasErrorOverlay.text,
            details: `Found in: ${hasErrorOverlay.selector}`
          });
          log(`  Next.js Error Overlay: ${hasErrorOverlay.text}`, 'red');
        }

        // Verify page has content
        const pageMetrics = await page.evaluate(() => {
          const body = document.body;
          if (!body) return { hasBody: false };
          
          const text = body.textContent?.trim() || '';
          const childCount = body.children.length;
          
          return {
            hasBody: true,
            textLength: text.length,
            childCount: childCount,
            isEmpty: text.length === 0 && childCount === 0
          };
        });

        if (pageMetrics.isEmpty) {
          warnings.push({
            source: 'content',
            message: 'Page rendered with no content'
          });
          log(`  Warning: Page appears to be empty`, 'yellow');
        } else if (pageMetrics.textLength < 20) {
          log(`  Page content: ${pageMetrics.textLength} chars, ${pageMetrics.childCount} elements`, 'dim');
        } else {
          log(`  Page content verified: ${pageMetrics.textLength} chars`, 'green');
        }
      } catch (evalError) {
        warnings.push({
          source: 'evaluation',
          message: `Could not evaluate page: ${evalError.message}`
        });
      }
    }

    // Summary for this route
    if (errors.length === 0 && warnings.length === 0) {
      log(`✅ Route ${route} passed all checks`, 'green');
    } else if (errors.length === 0) {
      log(`⚠️  Route ${route} passed with ${warnings.length} warning(s)`, 'yellow');
    } else {
      log(`❌ Route ${route} failed with ${errors.length} error(s)`, 'red');
    }

  } catch (error) {
    errors.push({
      source: 'test',
      message: `Test execution failed: ${error.message}`,
      stack: error.stack
    });
    log(`  Test Error: ${error.message}`, 'red');
  }

  return { route, errors, warnings, consoleMessages };
}

async function runBrowserTests() {
  const allResults = [];
  
  try {
    log('Launching headless browser...', 'blue');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Test each specified route
    for (const route of routesToTest) {
      const result = await testRoute(page, route);
      allResults.push(result);
    }

    // Final summary
    log('\n' + '='.repeat(50), 'blue');
    log('TEST SUMMARY', 'blue');
    log('='.repeat(50), 'blue');
    
    const totalErrors = allResults.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = allResults.reduce((sum, r) => sum + r.warnings.length, 0);
    const failedRoutes = allResults.filter(r => r.errors.length > 0);
    
    log(`\nRoutes tested: ${allResults.length}`, 'blue');
    log(`Passed: ${allResults.length - failedRoutes.length}`, 'green');
    log(`Failed: ${failedRoutes.length}`, failedRoutes.length > 0 ? 'red' : 'green');
    log(`Total errors: ${totalErrors}`, totalErrors > 0 ? 'red' : 'green');
    log(`Total warnings: ${totalWarnings}`, totalWarnings > 0 ? 'yellow' : 'green');

    // Show detailed errors
    if (failedRoutes.length > 0) {
      log('\n❌ ERRORS:', 'red');
      failedRoutes.forEach(result => {
        log(`\n  Route: ${result.route}`, 'red');
        result.errors.forEach((error, index) => {
          log(`    ${index + 1}. [${error.source}] ${error.message}`, 'red');
          if (error.details) {
            log(`       Details: ${error.details}`, 'dim');
          }
          if (error.hint) {
            log(`       Hint: ${error.hint}`, 'yellow');
          }
        });
      });
    }

    // Show warnings if any
    if (totalWarnings > 0 && process.env.VERBOSE) {
      log('\n⚠️  WARNINGS:', 'yellow');
      allResults.forEach(result => {
        if (result.warnings.length > 0) {
          log(`\n  Route: ${result.route}`, 'yellow');
          result.warnings.forEach((warning, index) => {
            log(`    ${index + 1}. [${warning.source}] ${warning.message}`, 'yellow');
          });
        }
      });
    }

    return {
      success: totalErrors === 0,
      results: allResults,
      totalErrors,
      totalWarnings
    };

  } catch (error) {
    log(`Test execution error: ${error.message}`, 'red');
    return { 
      success: false, 
      results: allResults,
      totalErrors: 1,
      totalWarnings: 0
    };
  }
}

async function cleanup() {
  log('\nCleaning up...', 'blue');
  
  if (browser) {
    await browser.close();
  }
}

async function main() {
  let exitCode = 0;
  
  try {
    log('='.repeat(50), 'blue');
    log('NEXT.JS RENDER TEST', 'blue');
    log('='.repeat(50), 'blue');
    log(`\nTesting routes: ${routesToTest.join(', ')}`, 'blue');
    log(`Server URL: ${URL}\n`, 'blue');
    
    // Verify server is running (it should always be running)
    try {
      await waitOn({
        resources: [URL],
        timeout: 10000,
        validateStatus: (status) => {
          // Accept any status code - we'll handle errors later
          // The server might return 500 if there's a rendering error
          return status >= 200 && status < 600;
        }
      });
      log('Dev server confirmed responding', 'green');
    } catch (error) {
      throw new Error(`Dev server not responding at ${URL}. Please ensure the dev server is running with 'yarn dev'`);
    }

    const result = await runBrowserTests();
    
    if (!result.success) {
      exitCode = 1;
      log('\n❌ TESTS FAILED', 'red');
      log('Fix the errors above and run the test again.', 'dim');
    } else {
      log('\n✅ ALL TESTS PASSED', 'green');
    }

  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'red');
    exitCode = 1;
  } finally {
    await cleanup();
    process.exit(exitCode);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  log('\nReceived SIGINT, cleaning up...', 'yellow');
  await cleanup();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  log('\nReceived SIGTERM, cleaning up...', 'yellow');
  await cleanup();
  process.exit(1);
});

// Run the tests
main().catch(error => {
  log(`Unhandled error: ${error}`, 'red');
  cleanup().then(() => process.exit(1));
});