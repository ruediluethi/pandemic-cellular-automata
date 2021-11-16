close all;
clear;
clc;

%filename = 'nicht_bestimmt_nicht_dia_dom';
filename = 'nicht_bestimmt';

nodes = csvread(['data/',filename,'_nodes.csv'], 1, 0);
beams = csvread(['data/',filename,'_beams.csv'], 1, 0);

%for k = 1:100

    % preprocessing
    [node_pos,beams] = preprocessor(nodes,beams);

    % call solver
    [u,F] = solver(nodes,beams,0);

    % postprocessing
    postprocessor(node_pos,beams,u,F);

    fig = gcf;
    fig.PaperUnits = 'centimeters';
    fig.InvertHardcopy = 'off';
    fig.PaperPosition = [0 0 30 30];
    %print(['output/problem_forces.png'],'-dpng','-r144');
    %print(['output/problem_bestimmt.png'],'-dpng','-r144');
    %print(['output/iterativ/',num2str(k),'.png'],'-dpng','-r144');
    pause(1);
    clf;

%end