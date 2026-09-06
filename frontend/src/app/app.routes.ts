import { Routes } from '@angular/router';
import { Onboarding } from './features/onboarding/onboarding';

export const routes: Routes = [
    {
        path: "",
        redirectTo: "onboarding",
        pathMatch: "full"
    },
    {
        path: "onboarding",
        loadComponent: () => 
            import("./features/onboarding/onboarding")
                .then(m => m.Onboarding)
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
