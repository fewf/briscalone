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
		const {card, onClick} = this.props;
		return (
			<span
				style={{
					color: getSuit(card) % 2 ? 'white' : 'red',
					fontSize: 35
				}}
				onClick={onClick}
			>
				{cardGlyphs[card]}
			</span>
		);
	}
}

export default Card;
