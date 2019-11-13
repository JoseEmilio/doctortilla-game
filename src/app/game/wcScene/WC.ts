import { Thing } from '../../engine/models/Thing';
import { IPoint, } from '../../engine/utils/Interfaces';
import { Directions } from '../../engine/utils/Directions';
import { selectedThing } from '../../engine/state/SelectedObjects';
import { uiBlocker } from '../../engine/ui/UIBlocker.singleton';

import { DoctortillaPlayer } from '../DoctortillaPlayer';

interface IWCOptions {
    id: string,
    name: string,
    x?: number,
    y?: number,
    goToPosition?: IPoint,
    spriteId: string,
    directionToLook?: Directions
}


export class WC extends Thing {
    constructor(protected options: IWCOptions) {
        super(options);
        this.changeAttr('PAPER_IN', 0);
    }

    get name(): string {
        if (this.isStuck())
        {
            return 'STUCK_WC';
        }

        return 'WC';        
    }

    protected lookAction(player: DoctortillaPlayer) {
        if (this.isStuck())
        {
            return player.say('WHAT_YOU_HAVE_DONE');
        }
        if (this.getAttr('CV_IN')) {
            player.say('I_SEE_MY_PHOTO');
        } else {
            player.say('I_COULD_USE_THEN_DAILY');
        }
    }

    protected useAction(player: DoctortillaPlayer) {
        if (this.isStuck())
        {
            return player.say('ITS_ALREADY_STUCK');
        }

        if (selectedThing.thing.id === 'cv') {
           this.throwCV(player);
        }

        if (selectedThing.thing.id === 'toilet_paper') {
            this.throwPaper(player);
        }

    }

    private throwCV(player: DoctortillaPlayer) {
        this.changeAttr('CV_IN', true);
        selectedThing.thing.changeAttr('IN_WC', true);

        uiBlocker.block();
        player.moveTo(this.options.goToPosition).then(() => {
            player.lookAt(Directions.UP);
            return player.say('THROW_CV_TO_WC');
        })
        .then(() => {
            return player.wait(700);
        })
        .then(() => {
            player.lookAt(Directions.DOWN);
            uiBlocker.unblock();
            return player.say('MORE_COPIES');
        })
        .then(() => {
            if (this.isStuck())
            {
                this.stuck();
                player.say('ITS_STUCK');
            }
        });
    }

    private throwPaper(player: DoctortillaPlayer) {
        player.removePaper();
        this.changeAttr('PAPER_IN', this.getAttr('PAPER_IN') + 1);
        if (this.getAttr('PAPER_IN') > 2) {
            if (!this.getAttr('CV_IN')) {
                player.say('PAPER_IS_TOO_THIN');
            } else {
                this.stuck();
                player.say('ITS_STUCK');
            }
        } else {
            player.say('ITS_GONNA_GET_STUCK');
        }
    }

    stuck(): void {
        this.changeAttr('STUCK', true);
    }

    isStuck(): boolean {
        return this.getAttr('CV_IN') && (this.getAttr('PAPER_IN') > 2);
    }

    protected onStateChange(): void {
        if(!this.sprite) {
            return;
        }
        if (this.getAttr('STUCK')) {
            this.sprite.frame = 1;
        } else {
            this.sprite.frame = 0;
        }
    }     

}