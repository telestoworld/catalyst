import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

import Viz from "viz.js";
import { Module, render } from "viz.js/full.render.js";

async function renderTopology() {
  const layersResponse = await fetch("/layers");
  const layers = await layersResponse.json();

  if (layers.length === 0) {
    const element = document.createElement("p");
    const text = document.createTextNode("No layers found! Join peers first maybe?");
    element.appendChild(text);
    document.body.appendChild(element);
  } else {
    await renderLayers(layers);
  }
}

async function renderLayers(layers) {
  let viz = new Viz({ Module, render });

  for (const layer of layers) {
    const h1 = document.createElement("h1");
    const text = document.createTextNode("Layer " + layer);
    h1.appendChild(text);
    document.body.appendChild(h1);

    const response = await fetch("/layers/blue/topology?format=graphviz");
    const topology = await response.text();
    console.log("topology", topology);

    viz
      .renderSVGElement(topology)
      .then(element => document.body.appendChild(element))
      .catch(error => {
        // Create a new Viz instance (@see Caveats page for more info)
        viz = new Viz();

        const element = document.createElement("p");
        const text = document.createTextNode("Error while rendering layer");
        element.appendChild(text);
        document.body.appendChild(element);

        console.error(error);
      });
  }
}

renderTopology();

function LayerSelector(props: { layers: string[]; onSelected: (layer: string) => any }) {
  return (
    <div>
      <label>
        Select a layer
        <select onChange={ev => props.onSelected(ev.target.value)}>
          {props.layers.map(it => (
            <option value={it}>it</option>
          ))}
        </select>
      </label>
    </div>
  );
}

function LayerTopologyViewer(props: { layer: string }) {
  const [topology, setTopology] = useState<string | undefined>(undefined);
  useEffect(() => {
    (async () => {
      const layersResponse = await fetch("/layers");
      const layersList = await layersResponse.json();

      setLayers(layersList);
    })();
  }, []);
}

function App() {
  const [layers, setLayers] = useState<string[]>([]);
  const [currentLayer, setCurrentLayer] = useState("");

  useEffect(() => {
    (async () => {
      const layersResponse = await fetch("/layers");
      const layersList = await layersResponse.json();

      setLayers(layersList);
    })();
  }, []);

  return (
    <div>
      <LayerSelector layers={layers} onSelected={setCurrentLayer} />
      {currentLayer && <LayerTopologyViewer layer={currentLayer} />}
    </div>
  );
}

export default function renderApp() {
  ReactDOM.render(<App />, document.getElementById("root"));
}

renderApp();
