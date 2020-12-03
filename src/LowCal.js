import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {Table} from 'react-bootstrap';
import './style/Dashboard.css';

class LowCal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      topten: [],
    };
    this.componentDidMount = this.componentDidMount.bind(this);
  }

  componentDidMount() {
    fetch("http://localhost:8081/lowcal", {
      method: "GET",
    })
      .then(res => res.json())
      .then(tenList => {
        if(!tenList) return;
        var arr= tenList.rows;
        var tenDivs = arr.map((recipe, i) => {
          return (<tr>
            <td>{i+1}</td>
            <td>{recipe[0]}</td>
            <td>{Number((recipe[1]).toFixed(1))}</td>
            <td>{Number((recipe[2]).toFixed(2))}</td>
          </tr>);
        });
        this.setState({
          topten: tenDivs
        })
      })
  }

  render() {
    return (
    <div className="results-container" id="results">
      <h3>Low Calorie</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Recipe</th>
            <th>Calories</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
        {this.state.topten}
        </tbody>
      </Table>
    </div>
    );
  }
}

export default LowCal;
