import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard, CanActiveLoginGuard, OrderCartHasProductsGuard } from '@b2b/guards';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'buy-from-supplier',
    pathMatch: 'full'
  },
  {
    path: 'buy-from-supplier',
    loadChildren: './modules/home/home.module#HomeModule'
  },
  {
    path: 'payment-success',
    loadChildren: './modules/payment-success/payment-success.module#PaymentSuccessModule'
  },
  /*{
    path: 'sign-in',
    loadChildren: './modules/sign-in/sign-in.module#SignInModule',
    canActivate: [CanActiveLoginGuard]
  },
  {
    path: 'sign-up',
    loadChildren: './modules/sign-up/sign-up.module#SignUpModule',
    canActivate: [CanActiveLoginGuard]
  },*/
  {
    path: 'profile',
    loadChildren: './modules/profile/profile.module#ProfileModule',
    canActivate: [AuthGuard],
  },
  {
    path: 'product/:productId',
    loadChildren: './modules/product-detail/product-detail.module#ProductDetailModule'
  },
  {
    path: 'make-individual-order',
    loadChildren: './modules/make-individual-order/make-individual-order.module#MakeIndividualOrderModule',
    canActivate: [OrderCartHasProductsGuard]
  },
  {
    path: 'deal/:lang',
    loadChildren: './modules/deal/deal.module#DealModule',
  },
  {
    path: 'policy/:lang',
    loadChildren: './modules/policy/policy.module#PolicyModule',
  },
  {
    path: 'support/:lang',
    loadChildren: './modules/support/support.module#SupportModule',
  },
  {
    path: 'contacts',
    loadChildren: './modules/contacts/contacts.module#ContactsModule',
  },
  {
    path: 'cart',
    loadChildren: './modules/cart/cart.module#CartModule',
  },
  {
    path: '**',
    redirectTo: 'buy-from-supplier'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
