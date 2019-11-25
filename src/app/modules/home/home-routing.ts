import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: ':categoryId',
    component: HomeComponent
  }
];

export const HomeRouting = RouterModule.forChild(routes);
