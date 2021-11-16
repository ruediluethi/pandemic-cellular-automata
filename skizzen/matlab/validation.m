close all;
clear;
clc;

% Gesamtsystem
F_Ay = 210;
F_By = 150;

% Knoten A
alpha = atan(4/4);
F_S2 = -210/sin(alpha);
F_S1 = 210;

% Knoten C
beta = atan(4/8);
gamma = atan(4/4);
F_S4 = F_S2*(sin(gamma) + cos(gamma))/(sin(beta) + cos(beta));
F_S3 = F_S4*sin(beta)/sin(gamma) - F_S2;

% Knoten B
F_S14 = F_S1*F_By/F_Ay;
F_S15 = F_S2*F_By/F_Ay;

% Knoten F
F_S13 = F_S3*F_S15/F_S2;
F_S12 = F_S4*F_S15/F_S2;

% Stabkraft F_S8 (Ritter-Schnitt)
F_S8 = (200*8 - 210*16)/8;

% Knoten D
phi = atan(8/4);
rho = atan(4/8);
III  = -(F_S8 - F_S4*cos(rho))/cos(phi);
IV   = -F_S4*sin(rho)/sin(phi);
F_S5 = (III - IV)/-2;
F_S7 = III + F_S5;

% Knoten E
V     = -(-F_S8 + F_S12*cos(rho))/cos(phi);
VI    = -F_S12*sin(rho)/sin(phi);
F_S9  = (V - VI)/-2;
F_S11 = V + F_S9;

% Stabkraft F_S6 (Ritter-Schnitt)
F_S6 = (200*4 - 210*12)/-8;

% Stabkraft F_S10 (Ritter-Schnitt)
F_S10 = (150*12 - 80*4)/8;

F_ana = [F_S1, F_S2, F_S3, F_S4, F_S5, F_S6, F_S7, F_S8, F_S9, F_S10, F_S11, F_S12, F_S13, F_S14, F_S15]';

filename = 'bruecke';

nodes = csvread(['data/',filename,'_nodes.csv'], 1, 0);
beams = csvread(['data/',filename,'_beams.csv'], 1, 0);

for e = 1:size(beams,1)
    % get nodes
    a = beams(e,2); % number of start node
    b = beams(e,3); % number of end node
    nodes(a,5) = nodes(a,5) - 100;
    nodes(b,5) = nodes(b,5) - 100;
end   

n = 1000;
%a = 7;
a = 5;
b = 300;
err = [];
it = [];
for i = n:-100:100
    i
    it(end+1) = i;

    % preprocessing
    [node_pos,beams] = preprocessor(nodes,beams);

    % call solver
    if i == n
        [u,F] = solver(nodes,beams);
    else
        [u,F] = solver(nodes,beams,i);
    end
    
    % postprocessing
    subplot(1,2,1);
    result = postprocessor(node_pos,beams,u,F,(i/n),i == 1);

    if i == n
        F_ana = result(:,5)
    end
    %F_err = abs(F_ana - result(:,5));
    %err(i) = norm(F_err);
    
    err(end+1) = norm(F_ana - result(:,5));
    
end

fig = gcf;
fig.PaperUnits = 'centimeters';
fig.InvertHardcopy = 'off';
fig.PaperPosition = [0 0 30 30];
%print(['output/validation_all.png'],'-dpng','-r144');

subplot(1,2,2);


plot(it,err,'k','LineWidth',1);
xlabel('Anzahl Iterationen');
ylabel('Fehler');

set(gca,'Color',[1,1,1]); % set background to white

fig = gcf;
fig.PaperUnits = 'centimeters';
fig.InvertHardcopy = 'on';
fig.PaperPosition = [0 0 10 10];
%print(['output/validation_err.png'],'-dpng','-r300');
