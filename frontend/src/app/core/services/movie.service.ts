import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Movie } from "../models/movie";


@Injectable({ providedIn: 'root' })
export class MovieService {
    private readonly http = inject(HttpClient)
    private readonly apiUrl = "http://localhost:3000/movies"

    searchMovie(search: string) {
        return this.http.get<Movie[]>(this.apiUrl, {
            params: { search }
        })

    }
}
