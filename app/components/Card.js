import React, {Component} from 'react';
import {getSuit} from '../../game/cardUtils';
const cardGlyphs = [
	'🃂', '🃃', '🃄', '🃅', '🃆', '🃋', '🃍', '🃎', '🃊', '🃁',
	'🂢', '🂣', '🂤', '🂥', '🂦', '🂫', '🂭', '🂮', '🂪', '🂡',
	'🂲', '🂳', '🂴', '🂵', '🂶', '🂻', '🂽', '🂾', '🂺', '🂱',
	'🃒', '🃓', '🃔', '🃕', '🃖', '🃛', '🃝', '🃞', '🃚', '🃑'
];

const num2Card = num => [
	[
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
	][num % 10],
	[
		'diamonds',
		'spades',
		'hearts',
		'clubs'
	][getSuit(num)]
]
const card2fileName = card => `${card[0]}_of_${card[1]}${
	['jack', 'queen', 'king'].indexOf(card[0]) !== -1 ? '2' : ''}.svg`;


class Card extends React.Component {
	render() {
		const {card, style, onClick, className} = this.props;
		if (isNaN(card)) return null;
		const cardArray = num2Card(card);
		return (
			<span
				className={className}
				onClick={onClick}
			>
				<img style={style} src={`./images/${card2fileName(cardArray)}`} alt={cardArray.join(' of ')} />
			</span>
		);
	}
}

export default Card;
