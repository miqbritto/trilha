import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { StudioAccess } from '../../core/services/studio-access.service';
import { StudioLogin } from './studio-login';
import { Studio } from './studio';

describe('Studio access', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideRouter(routes), provideHttpClient(), provideHttpClientTesting(),
    ] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requires a key when opening the Studio URL directly', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/studio', StudioLogin);
    expect(TestBed.inject(Router).url).toBe('/studio/login');
    expect(harness.routeNativeElement?.querySelector('.workspace-nav')).toBeNull();
    expect(TestBed.inject(StudioAccess).authenticated()).toBe(false);
  });

  it('only opens the Studio after successful validation and reuses the key', async () => {
    const harness = await RouterTestingHarness.create();
    const login = await harness.navigateByUrl('/studio', StudioLogin);
    login['key'] = 'test-key';
    login['login']();
    login['login']();
    expect(TestBed.inject(Router).url).toBe('/studio/login');
    const request = http.expectOne(req => req.url.endsWith('/admin/auth/check'));
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('x-admin-key')).toBe('test-key');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/studio');
    const studio = await harness.navigateByUrl('/studio', Studio);
    expect(studio['adminKey']).toBe('test-key');
    expect(harness.routeNativeElement?.querySelector('input[type="password"]')).toBeNull();
    TestBed.inject(StudioAccess).logout();
    await harness.navigateByUrl('/studio/login', StudioLogin);
    await harness.navigateByUrl('/studio', StudioLogin);
  });

  it.each([401, 403, 429, 500])('keeps the Studio closed after HTTP %i and allows retry', async status => {
    const harness = await RouterTestingHarness.create();
    const login = await harness.navigateByUrl('/studio', StudioLogin);
    login['key'] = 'invalid-key';
    login['login']();
    http.expectOne(req => req.url.endsWith('/admin/auth/check'))
      .flush(null, { status, statusText: 'Error' });
    expect(TestBed.inject(StudioAccess).authenticated()).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/studio/login');
    expect(login['loading']()).toBe(false);
    expect(login['error']()).not.toBe('');
    login['login']();
    http.expectOne(req => req.url.endsWith('/admin/auth/check'))
      .flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('does not submit a blank key', async () => {
    const harness = await RouterTestingHarness.create();
    const login = await harness.navigateByUrl('/studio', StudioLogin);
    login['key'] = '   ';
    login['login']();
    http.expectNone(req => req.url.endsWith('/admin/auth/check'));
  });
});
