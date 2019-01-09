import React, {Component} from 'react';
import {getSuit, getCardUnicode} from '../../game/cardUtils';
const cardGlyphs = [
	'🃂', '🃃', '🃄', '🃅', '🃆', '🃋', '🃍', '🃎', '🃊', '🃁',
	'🂢', '🂣', '🂤', '🂥', '🂦', '🂫', '🂭', '🂮', '🂪', '🂡',
	'🂲', '🂳', '🂴', '🂵', '🂶', '🂻', '🂽', '🂾', '🂺', '🂱',
	'🃒', '🃓', '🃔', '🃕', '🃖', '🃛', '🃝', '🃞', '🃚', '🃑'
];

class Card extends React.Component {
	render() {
		const {card} = this.props;
		return (
			<span>
				<span
					style={{
						color: getSuit(card) % 2 ? 'white' : 'red',
						fontSize: 35
					}}
				>
					{cardGlyphs[card])}
				</span>
			</span>
		);
	}
}

export default Card;
