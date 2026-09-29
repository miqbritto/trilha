import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { CreateMovie, Movie, MovieOption, RegisteredMovie } from "../models/movie";
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class MovieService {
    private readonly http = inject(HttpClient)
    private readonly apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}/movies`;

    create(movie: CreateMovie, adminKey: string) {
        return this.http.post<RegisteredMovie>(this.apiUrl, movie, {
            headers: { 'x-admin-key': adminKey },
        });
    }

    getDirector(tmdbId: number) {
        return this.http.get<{ director: string | null }>(
            `${this.apiUrl}/${tmdbId}/director`,
        );
    }

    searchMovie(search: string) {
        return this.http.get<Movie[]>(this.apiUrl, {
            params: { search }
        })
    }

    getMovieOptions(search: string) {
        return this.http.get<MovieOption[]>(`${this.apiUrl}/options`, {
            params: { search }
        })
    }
}
