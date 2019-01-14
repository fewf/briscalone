import React, {Component} from 'react';
import {getSuit, getCardUnicode} from '../../game/cardUtils';
const cardGlyphs = [
	'🃂', '🃃', '🃄', '🃅', '🃆', '🃋', '🃍', '🃎', '🃊', '🃁',
	'🂢', '🂣', '🂤', '🂥', '🂦', '🂫', '🂭', '🂮', '🂪', '🂡',
	'🂲', '🂳', '🂴', '🂵', '🂶', '🂻', '🂽', '🂾', '🂺', '🂱',
	'🃒', '🃓', '🃔', '🃕', '🃖', '🃛', '🃝', '🃞', '🃚', '🃑'
];
const num2fileName = num => `${[
	'2',
	'3',
	'4',
	'5',
	'6',
	'jack',
	'queen',
	'king',
	'10',
	'ace'
][num % 10]}_of_${[
	'diamonds',
	'spades',
	'hearts',
	'clubs'
][getSuit(num)]}${[5, 6, 7].indexOf(num % 10) !== -1 ? '2' : ''}.svg`;


class Card extends React.Component {
	render() {
		const {card, style, onClick} = this.props;
		if (isNaN(card)) return null;
		return (
			<span
				onClick={onClick}
			>
				<img style={style} src={`./images/${num2fileName(card)}`} />
			</span>
		);
	}
}

export default Card;
