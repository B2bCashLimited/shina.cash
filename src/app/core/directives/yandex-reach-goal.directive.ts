import { Directive, HostListener, Inject, Input } from '@angular/core';
import { YANDEX_METRIKA_KEY } from '../services/yandex-metrika-key';

// Кнопка регистрации - registration_button

type REACH_GOAL = 'registration_button';

@Directive({
  selector: '[appYandexReachGoal]'
})
export class YandexReachGoalDirective {

  @Input() appYandexReachGoal: REACH_GOAL;

  constructor(
    @Inject(YANDEX_METRIKA_KEY) private _yandexMetrikaKey) {
  }

  @HostListener('click', ['$event'])
  handleButtonClick() {
    const yandexMetrika = window['ym'];
    if (yandexMetrika && typeof yandexMetrika === 'function') {
      yandexMetrika(this._yandexMetrikaKey, 'reachGoal', this.appYandexReachGoal);
    }
  }
}
