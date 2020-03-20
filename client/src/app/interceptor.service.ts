import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class InterceptorService implements HttpInterceptor {

  constructor(private data: DataService) { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const headers: any = {
      'Content-Type': 'application/json'
    };
    if (this.data.userData && this.data.userData.token) {
      headers.Authorization = this.data.userData.token;
    }
    const request = req.clone({
      setHeaders: headers
    });
    return next.handle(request);
  }
}
