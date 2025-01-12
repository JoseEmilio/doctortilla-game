import { Game } from '../engine/models/Game';
import { DOCTORTILLA_LABELS } from './DoctortillaLabels';
import { DoctortillaPlayer } from './DoctortillaPlayer';

import { LiftLobbyScene } from './liftLobbyScene/LiftLobbyScene';
import { WCScene } from './wcScene/WCScene';
import { KitchenlobbyScene } from './kitchenlobbyScene/kitchenlobbyScene';

import { Directions } from '../engine/utils/Directions';
import { uiBlocker } from '../engine/ui/UIBlocker.singleton';

export class DoctortillaGame extends Game {
    constructor() {
        let options = {
            labels: DOCTORTILLA_LABELS,
            player: new DoctortillaPlayer(),
            scenes: [
                new LiftLobbyScene(),
                new WCScene(),
                new KitchenlobbyScene()
            ],
            initialSceneId: 'LIFTLOBBY',
            songs: ['ALLI_DONDE', 'SUBETE']
        };
        super(options);
    }

    protected onStart(): void {
        uiBlocker.block();
        let player = this.options.player;
        player.moveTo({ x: 223, y: 187})
            /*.then(() => {
               return player.wait(1000);
            })
            .then(() => {
                player.lookAt(Directions.DOWN);
                return player.say('LATE_FOR_CONCERT');
            })
            .then(() => {
               return player.say('AGAIN');
            })
            .then(() => {
               return player.say('THE_OTHERS_WILL_BE_READY');
            })
            .then(() => {
               return player.moveTo({ x: 383, y: 183});
            })*/
            .then(() => {
                uiBlocker.unblock();
            });
    }
}
