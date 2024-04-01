import { Injectable, Type, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterEvent,
  Event,
  RouterState,
} from '@angular/router';
import { filter } from 'rxjs/operators';

export const NavigationEvent = {
  Cancel: NavigationCancel,
  End: NavigationEnd,
  Error: NavigationError,
  Start: NavigationStart,
};

@Injectable({ providedIn: 'root' })
export class RouterEvents {
  protected readonly router = inject(Router);

  readonly #lastNavigation = signal<string | undefined>(undefined);
  lastNavigation = this.#lastNavigation.asReadonly();

  constructor() {
    this.listenToNavigation();
  }

  protected listenToNavigation(): void {
    this.router.events.pipe(filter(e => e instanceof NavigationEvent.End)).subscribe(() => {
      // It must be "NavigationTransition" but it is not exported in Angular
      //https://github.com/angular/angular/blob/9c486c96827a9282cbdbff176761bc95554a260b/packages/router/src/navigation_transition.ts#L282
      const lastNavigation = this.router.lastSuccessfulNavigation as unknown as any;
      const curr = lastNavigation.targetRouterState as RouterState;
      const currUrl = curr.snapshot.url;

      //Todo: improve this logic. Maybe we can handle error status in a better way ?
      if (!currUrl.includes('error')) {
        this.#lastNavigation.set(currUrl);
      }
    });
  }

  getEvents<T extends RouterEventConstructors>(...eventTypes: T) {
    const filterRouterEvents = (event: Event) => eventTypes.some(type => event instanceof type);

    return this.router.events.pipe(filter(filterRouterEvents));
  }

  getNavigationEvents<T extends NavigationEventKeys>(...navigationEventKeys: T) {
    type FilteredNavigationEvent = T extends (infer Key)[]
      ? Key extends NavigationEventKey
        ? InstanceType<NavigationEventType[Key]>
        : never
      : never;

    const filterNavigationEvents = (event: Event): event is FilteredNavigationEvent =>
      navigationEventKeys.some(key => event instanceof NavigationEvent[key]);

    return this.router.events.pipe(filter(filterNavigationEvents));
  }

  getAllEvents() {
    return this.router.events;
  }

  getAllNavigationEvents() {
    const keys = Object.keys(NavigationEvent) as NavigationEventKeys;
    return this.getNavigationEvents(...keys);
  }
}

type RouterEventConstructors = [Type<RouterEvent>, ...Type<RouterEvent>[]];

type NavigationEventKeys = [NavigationEventKey, ...NavigationEventKey[]];

type NavigationEventType = typeof NavigationEvent;

export type NavigationEventKey = keyof NavigationEventType;
