import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Dream, DreamFragment } from '../types';

interface NetworkGraphProps {
  dreams: Dream[];
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: string; // 'character', 'emotion', 'location', 'fragment'
  name: string;
  val: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ dreams }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || dreams.length === 0) return;

    // 1. Process Data
    const nodes: Node[] = [];
    const links: Link[] = [];
    const nodeSet = new Set<string>();

    dreams.forEach(dream => {
      dream.fragments.forEach(frag => {
        // Add Fragment Node
        if (!nodeSet.has(frag.id)) {
          nodes.push({ id: frag.id, group: 'fragment', name: frag.text.substring(0, 10) + '...', val: 10 });
          nodeSet.add(frag.id);
        }

        // Link Entities to Fragment
        const addEntityNode = (entity: string, group: string) => {
          const entityId = `${group}-${entity}`;
          if (!nodeSet.has(entityId)) {
            nodes.push({ id: entityId, group, name: entity, val: 5 });
            nodeSet.add(entityId);
          }
          links.push({ source: frag.id, target: entityId });
        };

        frag.characters.forEach(c => addEntityNode(c, 'character'));
        frag.emotions.forEach(e => addEntityNode(e, 'emotion'));
        frag.locations.forEach(l => addEntityNode(l, 'location'));
      });
    });

    // 2. Clear previous SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = 500;

    // 3. Simulation Setup
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30));

    // 4. Drawing
    const link = svg.append("g")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => d.group === 'fragment' ? 8 : 5)
      .attr("fill", (d) => {
        switch (d.group) {
          case 'fragment': return '#818cf8'; // Indigo
          case 'emotion': return '#f472b6'; // Pink
          case 'character': return '#34d399'; // Emerald
          case 'location': return '#fbbf24'; // Amber
          default: return '#94a3b8';
        }
      })
      .call(drag(simulation) as any);

    node.append("title")
      .text(d => d.name);
      
    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => d.name)
      .attr('font-size', '10px')
      .attr('fill', '#e2e8f0')
      .attr('dx', 12)
      .attr('dy', 4);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
      
      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function drag(simulation: d3.Simulation<Node, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
    
    return () => {
      simulation.stop();
    };
  }, [dreams]);

  return (
    <div className="w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl relative">
       <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur px-3 py-1 rounded text-xs text-slate-300">
         <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 mr-2"></span>片段
         <span className="inline-block w-2 h-2 rounded-full bg-pink-400 ml-2 mr-2"></span>情緒
         <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-2 mr-2"></span>人物
       </div>
      <svg ref={svgRef} className="w-full h-[500px]" style={{ cursor: 'grab' }}></svg>
    </div>
  );
};

export default NetworkGraph;