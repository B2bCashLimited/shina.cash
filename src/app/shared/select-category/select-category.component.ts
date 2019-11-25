import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CategoriesService, ConfigService } from '@b2b/services';
import { Category } from '@b2b/models';
import { delay, filter, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-select-category',
  templateUrl: './select-category.component.html',
  styleUrls: ['./select-category.component.scss']
})
export class SelectCategoryComponent implements OnInit, OnDestroy {
  @Input() homePage = false;
  @Input() isIndividualChina = false;
  @Input() supplierOrManufacturer: 1 | 2;      // не обяз, поставщик(1) (для физ лиц заказ по наличию) или производитель(2)
  // (для физ лиц заказ из Китая) или оба(undefined) (для юр лиц)
  @Output() categoryChange = new EventEmitter<Category>();
  @Output() categoryChangeOnInit = new EventEmitter<Category>();

  category: Category;
  categories: Category[] = [];

  private _selectedCategory: Category;

  constructor(
    public config: ConfigService,
    private _categoriesService: CategoriesService,
    private _route: ActivatedRoute,
    private _router: Router
  ) {
  }

  get selectedCategory(): Category {
    return this._selectedCategory;
  }

  @Input() set selectedCategory(value: Category) {
    if (this._selectedCategory !== value) {
      this._selectedCategory = value;
    }
  }

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
    this._categoriesService.getCategoryByName('Шины и Диски')
      .pipe(
        filter((res: any[]) => !!res && res.length > 0),
        map((res: any[]) => {
          return res.find(value => !(value.path as string).includes('.'));
        }),
        switchMap((res: any) => {
          if (this.isIndividualChina) {
            return this._categoriesService.getCategoriesWithProductsIds(res.id)
              .pipe(
                map((categories: number[]) => {
                  return {parentId: res.id, ...categories};
                }));
          }

          return of(res);
        }),
        switchMap((res: any) => {
          if (res) {
            return this._categoriesService.getCategoryByIdAndNormalizeChildren(this.isIndividualChina ? res.parentId : res.id)
              .pipe(
                tap((categories: Category[]) => {
                  const filteredCategories: Category[] = [];

                  if (this.isIndividualChina && res.categories) {
                    categories.forEach(node => {
                      (res.categories as number[]).forEach(categoryId => {
                        if (node.id === categoryId) {
                          filteredCategories.push(node);
                        }
                      });
                    });

                    this.categories = filteredCategories;
                  } else {
                    this.categories = categories;
                  }
                }),
                delay(100)
              );
          }

          return of(null);
        })
      )
      .subscribe((categories: Category[]) => {
        if (categories && categories.length > 0) {
          const categoryId = this._route.snapshot.params.categoryId;

          if (!categoryId) {
            this.category = categories[0];
            this._router.navigate([`${this.category.id}`], {relativeTo: this._route, queryParamsHandling: 'merge'});
          } else {
            this.category = categories.find(category => category.id === +categoryId);
            this.categoryChangeOnInit.emit(this.category);
          }
        }
      });
  }

  onCategoryChanged(evt: Category): void {
    this.categoryChange.emit(evt);
  }
}
