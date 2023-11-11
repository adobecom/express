/* eslint-disable no-mixed-operators */
/* eslint-disable prefer-destructuring */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-use-before-define */
import { html, Component } from '../../../scripts/libs/htm-preact.js';
// import { loadCSS } from '../../../scripts/utils.js';

// loadCSS('/express/blocks/preact-demo/temperature/temperature.css');

const scaleNames = {
  c: 'Celsius',
  f: 'Fahrenheit',
};

function toCelsius(fahrenheit) {
  return ((fahrenheit - 32) * 5) / 9;
}

function toFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

function tryConvert(value, convert) {
  const input = parseFloat(value);
  if (Number.isNaN(input)) {
    return '';
  }
  const output = convert(input);
  const rounded = Math.round(output * 1000) / 1000;
  return rounded.toString();
}

function TempZones(props) {
  if (props.celsius >= 100) {
    return html`<h5 className="hot">It's getting Hot in here!</h5>`;
  } else if (props.celsius >= 36.5 && props.celsius <= 37.5) {
    return html`<h5 className="normal">This is the normal temperature of the human body!</h5>`;
  } else if (props.celsius <= 0) {
    return html`<h5 className="cold">Brr...Freezing!</h5>`;
  }
  return null;
}

class TemperatureInput extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    this.props.onInput(e.target.value);
  }

  render() {
    const value = this.props.value;
    const scale = this.props.scale;
    return html`<div className="container">
      <form>
        <div className="form-group">
          <lable><h3>Enter Temperature in ${scaleNames[scale]}:</h3></lable>
          <input
            className="form-control container text-center"
            id="focusedInputed"
            type="text"
            value=${value}
            onInput=${this.handleChange}
          />
        </div>
      </form>
    </div> `;
  }
}

class Calculator extends Component {
  constructor(props) {
    super(props);
    this.handleCelsiusChange = this.handleCelsiusChange.bind(this);
    this.handleFahrenheitChange = this.handleFahrenheitChange.bind(this);
    this.state = { value: '', scale: 'c' };
  }

  handleCelsiusChange(value) {
    this.setState({ scale: 'c', value });
  }

  handleFahrenheitChange(value) {
    this.setState({ scale: 'f', value });
  }

  render() {
    const scale = this.state.scale;
    const value = this.state.value;
    const celsius = scale === 'f' ? tryConvert(value, toCelsius) : value;
    const fahrenheit = scale === 'c' ? tryConvert(value, toFahrenheit) : value;

    return html`
      <div className="text-center container-fluid">
        <${TemperatureInput} scale="c" value=${celsius} onInput=${this.handleCelsiusChange} />
        <${TemperatureInput}
          scale="f"
          value=${fahrenheit}
          onInput=${this.handleFahrenheitChange}
        />
        <${TempZones} celsius=${parseFloat(celsius)} />
      </div>
    `;
  }
}

export default function Temperature() {
  return html` <div class='temperature'><${Calculator} /></div>`;
}
