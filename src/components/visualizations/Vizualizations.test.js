import React from 'react';
import ReactDOM from 'react-dom';
import RiskGraph from './risk-graph';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<RiskGraph />, div);
    ReactDOM.unmountComponentAtNode(div);
});