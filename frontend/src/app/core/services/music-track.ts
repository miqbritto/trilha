import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { CreateMusicTrack, MusicTrack } from '../models/music-track';


@Injectable({ providedIn: "root" })
export class MusicTrackService {
    private readonly http = inject(HttpClient)
    private readonly apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}/music`;

    create(
        music: CreateMusicTrack,
        file: File,
        adminKey: string
    ) {
        const body = new FormData();

        body.append("title", music.title);
        body.append("movieId", music.movieId)
        body.append("file", file)

        if (music.artist?.trim()) {
            body.append('artist', music.artist.trim());
        }

        if (music.note?.trim()) {
            body.append('note', music.note.trim());
        }

        return this.http.post<MusicTrack>(this.apiUrl, body, {
            headers: { "x-admin-key": adminKey }
        })
    }
}
