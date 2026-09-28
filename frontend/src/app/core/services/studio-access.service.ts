import { HttpClient } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";
import { environment } from "../../../environments/environment.development";
import { tap, timeout } from "rxjs";


@Injectable({ providedIn: 'root' })
export class StudioAccess {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}/admin/auth`;

    private readonly adminKey = signal<string | null>(null)

    readonly authenticated = computed(() => this.adminKey() !== null)

    login(key: string) {
        return this.http.post(`${this.apiUrl}/check`, null, 
            {
                headers: { 'x-admin-key': key}
            },
        ).pipe(
            timeout(15_000),
            tap(() => this.adminKey.set(key))
        )
    }

    getKey() {
        const key = this.adminKey();

        if(key === null) {
            throw new Error("Acesso não autorizado")
        }

        return key;
    }

    logout() {
        this.adminKey.set(null);
    }
}
