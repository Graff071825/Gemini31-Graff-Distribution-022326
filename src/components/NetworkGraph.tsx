import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { DeviceRecord } from '../App';

interface NetworkGraphProps {
  data: DeviceRecord[];
  onNodeClick?: (node: { type: string; id: string; label: string }) => void;
  accentColor: string;
  theme: 'light' | 'dark';
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
  radius: number;
  type: string;
  originalId: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value: number;
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ data, onNodeClick, accentColor, theme }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 400;

    d3.select(svgRef.current).selectAll("*").remove();

    const nodesMap = new Map<string, Node>();
    const linksMap = new Map<string, Link>();

    const addNode = (id: string, group: number, label: string, type: string, originalId: string) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, group, label, radius: group === 1 ? 15 : group === 2 ? 12 : group === 3 ? 10 : group === 4 ? 8 : 6, type, originalId });
      }
    };

    const addLink = (source: string, target: string) => {
      const linkId = `${source}-${target}`;
      if (!linksMap.has(linkId)) {
        linksMap.set(linkId, { source, target, value: 1 });
      } else {
        linksMap.get(linkId)!.value += 1;
      }
    };

    data.forEach(record => {
      const supplier = `sup-${record.SupplierID || 'Unknown'}`;
      const category = `cat-${record.Category || 'Unknown'}`;
      const license = `lic-${record.LicenseNo || 'Unknown'}`;
      const model = `mod-${record.Model || 'Unknown'}`;
      const customer = `cus-${record.CustomerID || 'Unknown'}`;

      addNode(supplier, 1, record.SupplierID || 'Unknown', 'SupplierID', record.SupplierID || 'Unknown');
      addNode(category, 2, record.Category ? record.Category.substring(0, 15) + '...' : 'Unknown', 'Category', record.Category || 'Unknown');
      addNode(license, 3, record.LicenseNo || 'Unknown', 'LicenseNo', record.LicenseNo || 'Unknown');
      addNode(model, 4, record.Model || 'Unknown', 'Model', record.Model || 'Unknown');
      addNode(customer, 5, record.CustomerID || 'Unknown', 'CustomerID', record.CustomerID || 'Unknown');

      addLink(supplier, category);
      addLink(category, license);
      addLink(license, model);
      addLink(model, customer);
    });

    const nodes = Array.from(nodesMap.values());
    const links = Array.from(linksMap.values());

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    const color = d3.scaleOrdinal<number, string>()
      .domain([1, 2, 3, 4, 5])
      .range([
        accentColor,
        hexToRgba(accentColor, 0.8),
        hexToRgba(accentColor, 0.6),
        hexToRgba(accentColor, 0.4),
        hexToRgba(accentColor, 0.2)
      ]);

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(40))
      .force("charge", d3.forceManyBody().strength(-80))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => (d as Node).radius + 2));

    const link = svg.append("g")
      .attr("stroke", theme === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));

    const node = svg.append("g")
      .attr("stroke", theme === 'dark' ? "#000" : "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => color(d.group))
      .style("cursor", "pointer")
      .call(drag(simulation) as any)
      .on("click", (event, d) => {
        if (onNodeClick) {
          onNodeClick({ type: d.type, id: d.originalId, label: d.label });
        }
      });

    node.append("title")
      .text(d => d.label);

    const labels = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dy", 3)
      .attr("dx", d => d.radius + 2)
      .attr("font-size", "8px")
      .attr("fill", theme === 'dark' ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)")
      .attr("font-family", "monospace")
      .style("pointer-events", "none")
      .text(d => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      node
        .attr("cx", d => Math.max(d.radius, Math.min(width - d.radius, d.x!)))
        .attr("cy", d => Math.max(d.radius, Math.min(height - d.radius, d.y!)));
        
      labels
        .attr("x", d => Math.max(d.radius, Math.min(width - d.radius, d.x!)))
        .attr("y", d => Math.max(d.radius, Math.min(height - d.radius, d.y!)));
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
  }, [data, accentColor, theme]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px]">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
