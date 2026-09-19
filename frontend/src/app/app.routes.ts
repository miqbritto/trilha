import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: "",
        redirectTo: "game",
        pathMatch: "full"
    },
    {
        path: "onboarding",
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
        path: "game-over",
        loadComponent: () => 
            import("./features/game-over/game-over")
                .then(m => m.GameOver)
    }
];
