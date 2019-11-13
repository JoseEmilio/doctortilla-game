import { Thing } from '../../engine/models/Thing';
import { DoctortillaPlayer } from '../DoctortillaPlayer';
import { randomText } from '../../engine/utils/RandomText';
import { selectedThing } from '../../engine/state/SelectedObjects';

let options = {
    id: 'BIN',
    x: 288,
    y: 115,
    spriteId: 'BIN',
    name: 'BIN'
};

export class Bin extends Thing {
    constructor() {
        super(options);
    }

    protected lookAction(player: DoctortillaPlayer) {
        player.say('REGULAR_BIN');
    }

    protected useAction(player: DoctortillaPlayer) {
        if (selectedThing.thing.id === 'cv') {
            if (selectedThing.thing.getAttr('IN_WC')) {
                player.say('YOU_ALREADY_THROW_TO_WC');
            } else {
                player.say(randomText(
                    'TRYING_TO_MAKE_A_POINT',
                    'I_DONT_WANT',
                    'YOURE_A_BAD_PERSON'
                ));
            }
        }
    }

    protected openAction(player: DoctortillaPlayer) {
        player.say('NOT_SO_NEEDY');
    }
}