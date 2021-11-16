close all;
clear;
clc;

% https://de.wikipedia.org/wiki/SBB_Re_460y

filename = 'validation';

nodes = csvread(['data/',filename,'_nodes.csv'], 1, 0);
beams = csvread(['data/',filename,'_beams.csv'], 1, 0);

% preprocessing
[node_pos,beams] = preprocessor(nodes,beams);

% call solver
[u,F] = solver(nodes,beams)

% postprocessing
postprocessor(node_pos,beams,u,F);