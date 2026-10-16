import {
  Component,
  Compiler,
  ElementRef,
  EventEmitter,
  NgModule,
  OnInit,
  Output,
  Renderer2,
  SecurityContext,
  inject,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClientXsrfModule, withNoXsrfProtection } from '@angular/common/http';
import { Subject, interval, map, of, takeUntil } from 'rxjs';

// NOTE: Intentionally flawed code, one instance per Norma Angular rule, for testing auto discovery.
// Not wired into the routes.

const dynamicLabel = 'Pizza';

// 3b. ng-sec-runtime-template-compilation: template built with ${x}
@Component({
  selector: 'app-dynamic-template',
  standalone: true,
  template: `<p>${dynamicLabel}</p>`,
})
export class DynamicTemplateComponent {}

@NgModule({})
export class RuntimeModule {}

// 4. ng-sec-xsrf-disabled
export const noXsrfFeature = withNoXsrfProtection();
export const noXsrfModule = HttpClientXsrfModule.disable();

@Component({
  selector: 'app-issues-playground',
  standalone: true,
  templateUrl: './issues-playground.component.html',
})
export class IssuesPlaygroundComponent implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly renderer = inject(Renderer2);
  private readonly el = inject(ElementRef);
  private readonly compiler = inject(Compiler);
  private readonly destroy$ = new Subject<void>();

  items = [{ id: 1, name: 'Margherita' }, { id: 2, name: 'Pepperoni' }];

  // 9. ng-mnt-output-native-event
  @Output() click = new EventEmitter<void>();
  change = output<string>({ alias: 'change' });

  ngOnInit(): void {
    this.loadData();
  }

  // 1. ng-sec-bypass-security-trust
  trust(userInput: string) {
    const html = this.sanitizer.bypassSecurityTrustHtml(userInput);
    const raw = this.sanitizer.sanitize(SecurityContext.NONE, userInput);
    return { html, raw };
  }

  // 2. ng-sec-renderer-raw-html
  render(userInput: string) {
    this.renderer.setProperty(this.el.nativeElement, 'innerHTML', userInput);
  }

  // 3a. ng-sec-runtime-template-compilation
  compile() {
    return this.compiler.compileModuleSync(RuntimeModule);
  }

  // 5. ng-mng-take-until-destroyed-context (no injection context inside a method)
  watch() {
    interval(1000).pipe(takeUntilDestroyed()).subscribe(() => {});
  }

  // 6. ng-mng-take-until-not-last
  watchLeaky() {
    interval(1000)
      .pipe(takeUntil(this.destroy$), map((n) => n * 2))
      .subscribe();
  }

  // 7. ng-mnt-nested-subscribe
  loadData() {
    of(1).subscribe((a) => {
      of(a + 1).subscribe((b) => console.log(b));
    });
  }

  // 8. ng-mnt-lifecycle-hook-called
  reload() {
    this.ngOnInit();
  }

  // 10. ts-any-type-usage
  anyField: any = null;

  parseOrder(payload: any): any {
    return payload.items as any;
  }

  mergeOrders(orders: any[], extra: Array<any>, lookup: Record<string, any>) {
    const cast = <any>orders;
    return { cast, extra, lookup };
  }

  // 11. ts-api-key-in-client (fake placeholder values)
  private readonly apiKey = 'sk_live_FAKE0000000000000000000000';
  private readonly mapsApiKey = 'AIzaSyFAKE000000000000000000000000000';

  callPaymentApi() {
    const headers = { Authorization: 'Bearer ' + this.apiKey };
    return fetch(`https://api.example.com/charge?api_key=${this.mapsApiKey}`, { headers });
  }
}

// 11b. ts-api-key-in-client: module-level secrets
export const environmentConfig = {
  apiKey: 'FAKE-api-key-1234567890abcdef',
  clientSecret: 'FAKE-client-secret-abcdef1234567890',
  firebase: { apiKey: 'AIzaSyFAKE111111111111111111111111111' },
};
export const STRIPE_SECRET_KEY = 'sk_test_FAKE1111111111111111111111';

