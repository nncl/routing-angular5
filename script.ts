import { NgModule, Component, Injectable } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { JsonpModule, Jsonp, Response } from '@angular/http';
import { ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { Routes, RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/toPromise';

class SearchItem {
    constructor(public name: string,
                public artist: string,
                public link: string,
                public thumbnail: string,
                public artistId: string) {
    }
}

@Injectable()
class SearchService {
    apiRoot: string = 'https://itunes.apple.com/search';
    results: SearchItem[];

    constructor(private jsonp: Jsonp) {
        this.results = [];
    }

    search(term: string) {
        return new Promise((resolve, reject) => {
            this.results = [];
            let apiURL = `${this.apiRoot}?term=${term}&media=music&limit=20&callback=JSONP_CALLBACK`;
            this.jsonp.request(apiURL)
                .toPromise()
                .then(
                    res => { // Success
                        this.results = res.json().results.map(item => {
                            return new SearchItem(
                                item.trackName,
                                item.artistName,
                                item.trackViewUrl,
                                item.artworkUrl30,
                                item.artistId
                            );
                        });
                        resolve();
                    },
                    msg => { // Error
                        reject(msg);
                    }
                );
        });
    }
}

@Component({
    selector: 'app-artist',
    template: `
<h1>Artist</h1>
<p>
    <a [routerLink]="['./tracks']">Tracks</a>
    <a [routerLink]="['./albums']">Albums</a>
</p>
<router-outlet></router-outlet>
`
})
class ArtistComponent {

}

@Component({
    selector: 'app-artist-track-list',
    template: `
<h1>Artist Track Listing</h1>    
`
})
class ArtistTrackListComponent {
    constructor(private route: ActivatedRoute) {
        this.route.parent.params.subscribe(params => console.log(params));
    }
}

@Component({
    selector: 'app-artist-album-list',
    template: `
<h1>Artist Album Listing</h1>    
`
})
class ArtistAlbumListComponent {
    constructor(public route: ActivatedRoute) {
        this.route.parent.params.subscribe(params => console.log(params));
    }
}

@Component({
    selector: 'app-search',
    template: `<form class="form-inline">
  <div class="form-group">
    <input type="search"
           class="form-control"
           placeholder="Enter search string"
           #search>
  </div>
  <button type="button"
          class="btn btn-primary"
          (click)="onSearch(search.value)">
    Search
  </button>
</form>

<hr />

<div class="text-center">
  <p class="lead"
     *ngIf="loading">Loading...</p>
</div>

<div class="list-group">
  <a [routerLink]="['/artist', track.artistId]"
     class="list-group-item list-group-item-action"
     *ngFor="let track of itunes.results">
    <img src="{{track.thumbnail}}">
    {{ track.name }} <span class="text-muted">by</span> {{ track.artist }}
  </a>
</div>
 `
})
class SearchComponent {
    private loading: boolean = false;

    constructor(private itunes: SearchService,
                private route: ActivatedRoute,
                private router: Router) {
        this.route.params.subscribe(params => {
            if (params['term']) {
                this.doSearch(params['term']);
            }
        });
    }

    onSearch(term: string) {
        // Term here is optional
        this.router.navigate(['search', {term: term}]);
    }

    doSearch(term: string) {
        this.loading = true;
        this.itunes.search(term).then(_ => this.loading = false)
    }
}

@Component({
    selector: 'app-home',
    template: `
<div class="jumbotron">
  <h1 class="display-3">iTunes Search App</h1>
</div>
 `
})
class HomeComponent {
}

@Component({
    selector: 'app-header',
    template: `
<nav class="navbar navbar-light bg-faded">
  <a class="navbar-brand" [routerLink]="['home']">iTunes Search App</a>
  <ul class="nav navbar-nav">
    <li class="nav-item" [routerLinkActive]="['active']" #rla="routerLinkActive">
      <a class="nav-link" [routerLink]="['home']">
        Home {{ rla.isActive ? '(already open)' : ''}}
      </a>
    </li>
    <li class="nav-item" [routerLinkActive]="['active']">
      <a class="nav-link" [routerLink]="['search']">Search</a>
    </li>
  </ul>
</nav>
 `
})
class HeaderComponent {
    constructor(private route: Router) {
    }

    /*
    goHome() {
        this.route.navigate(['']);
    }

    goSearch() {
        this.route.navigate(['search']);
    }
    */
}

@Component({
    selector: 'app',
    template: `
	<app-header></app-header>
	<div class="m-t-1">
    <router-outlet></router-outlet>
  </div>
 `
})
class AppComponent {
}

const appRoutes: Routes = [
    {path: '', redirectTo: 'home', pathMatch: 'full'}
    , {path: 'find', redirectTo: 'search'}
    , {path: 'home', component: HomeComponent}
    , {path: 'search', component: SearchComponent}
    , {
        path: 'artist/:artistId',
        component: ArtistComponent,
        children: [
            {path: '', redirectTo: 'tracks', pathMatch: 'full'},
            {path: 'tracks', component: ArtistTrackListComponent},
            {path: 'albums', component: ArtistAlbumListComponent}
        ]
    }
    , {path: '**', component: HomeComponent} // like a 404 page
];

@NgModule({
    imports: [
        BrowserModule,
        ReactiveFormsModule,
        FormsModule,
        JsonpModule,
        RouterModule.forRoot(appRoutes, {useHash: true})
    ],
    declarations: [
        AppComponent,
        SearchComponent,
        HomeComponent,
        HeaderComponent,
        ArtistComponent,
        ArtistTrackListComponent,
        ArtistAlbumListComponent
    ],
    bootstrap: [AppComponent],
    providers: [SearchService]
})
class AppModule {
}

platformBrowserDynamic().bootstrapModule(AppModule);