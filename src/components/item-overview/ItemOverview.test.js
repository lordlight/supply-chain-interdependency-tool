import React from 'react';
import ReactDOM from 'react-dom';
import ItemOverview from './item-overview';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<ItemOverview />, div);
    ReactDOM.unmountComponentAtNode(div);
});