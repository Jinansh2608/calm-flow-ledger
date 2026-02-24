import { API_CONFIG } from '@/config/api';
import { AuthService } from './api';

export const apiDiagnostics = {
  async runDiagnostics() {
    console.log('=== API DIAGNOSTICS START ===');
    console.log('Base URL:', API_CONFIG.BASE_URL);
    console.log('Timeout:', API_CONFIG.TIMEOUT, 'ms');
    
    const results: Record<string, unknown> = {
      baseUrl: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      checks: {}
    };

    // Check health endpoint
    console.log('\n1. Checking /health endpoint...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const healthResponse = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      results.checks = {
        ...((results.checks as Record<string, unknown>) || {}),
        health: {
          status: healthResponse.status,
          ok: healthResponse.ok,
          statusText: healthResponse.statusText
        }
      };
      console.log('✓ Health check:', healthResponse.status, healthResponse.statusText);
    } catch (error: unknown) {
      const err = error as Error;
      results.checks = {
        ...((results.checks as Record<string, unknown>) || {}),
        health: { error: err.message, name: err.name }
      };
      console.error('✗ Health check failed:', err.name, '-', err.message);
    }

    // Check auth signup endpoint
    console.log('\n2. Checking /auth/signup endpoint...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const signupResponse = await fetch(`${API_CONFIG.BASE_URL}/auth/signup`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', email: 'test@test.com', password: 'test' }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      results.checks = {
        ...((results.checks as Record<string, unknown>) || {}),
        auth_signup: {
          status: signupResponse.status,
          ok: signupResponse.ok,
          statusText: signupResponse.statusText
        }
      };
      console.log('✓ Auth signup endpoint:', signupResponse.status, signupResponse.statusText);
    } catch (error: unknown) {
      const err = error as Error;
      results.checks = {
        ...((results.checks as Record<string, unknown>) || {}),
        auth_signup: { error: err.message, name: err.name }
      };
      console.error('✗ Auth signup endpoint failed:', err.name, '-', err.message);
    }

    // Check vendors endpoint
    console.log('\n3. Checking /vendors endpoint...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const vendorsResponse = await fetch(`${API_CONFIG.BASE_URL}/vendors`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      results.checks = {
        ...((results.checks as Record<string, unknown>) || {}),
        vendors: {
          status: vendorsResponse.status,
          ok: vendorsResponse.ok,
          statusText: vendorsResponse.statusText
        }
      };
      if (vendorsResponse.ok) {
        const data = await vendorsResponse.json();
        console.log('✓ Vendors endpoint works. Response:', data);
      } else {
        console.warn('✗ Vendors endpoint returned', vendorsResponse.status);
      }
    } catch (error: unknown) {
      const err = error as Error;
      results.checks = {
        ...((results.checks as Record<string, unknown>) || {}),
        vendors: { error: err.message, name: err.name }
      };
      console.error('✗ Vendors endpoint failed:', err.name, '-', err.message);
    }

    // Check PO endpoint
    console.log('\n4. Checking /po endpoint...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const poResponse = await fetch(`${API_CONFIG.BASE_URL}/po`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      results.checks = {
        ...((results.checks as Record<string, unknown>) || {}),
        po: {
          status: poResponse.status,
          ok: poResponse.ok,
          statusText: poResponse.statusText
        }
      };
      if (poResponse.ok) {
        const data = await poResponse.json();
        console.log('✓ PO endpoint works. Response:', data);
      } else {
        console.warn('✗ PO endpoint returned', poResponse.status);
      }
    } catch (error: unknown) {
      const err = error as Error;
      results.checks = {
        ...((results.checks as Record<string, unknown>) || {}),
        po: { error: err.message, name: err.name }
      };
      console.error('✗ PO endpoint failed:', err.name, '-', err.message);
    }

    console.log('\n=== API DIAGNOSTICS END ===');
    console.log('Results:', results);
    
    return results;
  }
};

// Run diagnostics on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    console.log('Running API diagnostics...');
    apiDiagnostics.runDiagnostics().catch(console.error);
  });
}
