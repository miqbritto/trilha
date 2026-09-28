import { Routes } from '@angular/router';
import { studioAccessGuard } from './core/guards/studio-access.guard';

export const routes: Routes = [
    {
        path: 'studio/login',
        title: 'Acesso ao estúdio | trilha',
        loadComponent: () => import('./features/studio/studio-login').then(m => m.StudioLogin),
    },
    {
        path: "studio",
        canActivate: [studioAccessGuard],
        title: "Estúdio | trilha",
        loadComponent: () =>
            import("./features/studio/studio")
                .then(m => m.Studio)
    },
    {
        path: "",
        redirectTo: "game",
        pathMatch: "full"
    },
    {
        path: "game",
        loadComponent: () => 
            import("./features/game/game")
                .then(m => m.Game)
    },
    {
        path: "game/:challengeId",
        loadComponent: () =>
            import("./features/game/game")
                .then(m => m.Game)
    },
    {
        path: "game-over",
        loadComponent: () => 
            import("./features/game-over/game-over")
                .then(m => m.GameOver)
    },
    {
        path: "history",
        loadComponent: () => 
            import("./features/history/history")
                .then(m => m.History)
    }

];
