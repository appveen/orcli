import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './dashboard/home/home.component';
import { ReleaseComponent } from './dashboard/release/release.component';
import { HotfixComponent } from './dashboard/hotfix/hotfix.component';
import { LoginGuard } from './guards/login.guard';
import { AuthGuard } from './guards/auth.guard';


const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
  {
    path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard], canActivateChild: [AuthGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'hotfix' },
      { path: 'home', component: HomeComponent },
      { path: 'hotfix', component: HotfixComponent },
      { path: 'release', component: ReleaseComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: true
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
