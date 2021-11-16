close all;
clear;
clc;

% https://de.wikipedia.org/wiki/M%C3%BCngstener_Br%C3%BCcke

filename = 'bruecke';

frames = 101;
all_stress = zeros(1,frames*2);
for k = 1:frames*2
%for k = 50
    k
    t = 1/frames*k;
    
    nodes = csvread(['data/',filename,'_nodes.csv'], 1, 0);
    beams = csvread(['data/',filename,'_beams.csv'], 1, 0);

    % preprocessing
    [node_pos,beams] = preprocessor(nodes,beams);

    n = length(node_pos);
    x = 1:2:n;
    y = 2:2:n;
    highest_point = max(node_pos(y)) - 1;
    rail_beams = [];

    % add weight
    % add train
    density = 7.86e-6; % density steel: 7.86 g/cm^3 = 7.86e-6 kg/mm^3
    for e = 1:size(beams,1)
        % get nodes
        a = beams(e,2); % number of start node
        b = beams(e,3); % number of end node
        node_start = nodes(a,:);
        node_end   = nodes(b,:);

        % add beam weight
        L = beams(e,7); % length
        A = 10*10; % area
        beams(e,4) = A;
        Fg = L*A*density*9.81/1000; % force in kN
        nodes(a,5) = nodes(a,5) - Fg/2;
        nodes(b,5) = nodes(b,5) - Fg/2;

        % add railway
        if node_start(3) > highest_point && node_end(3) > highest_point

            railway_beam = beams(e,:);
            
            start_x = node_start(2);
            end_x   = node_end(2);
            if end_x < start_x
                temp_x  = end_x;
                end_x   = start_x;
                start_x = temp_x;
                
                temp = railway_beam(3);
                railway_beam(3) = railway_beam(2);
                railway_beam(2) = temp;
            end

            railway_beam(9) = start_x;
            railway_beam(10) = end_x;
            rail_beams(end+1,:) = railway_beam;
        end
    end

    % sort in x direction
    [~,I] = sort(rail_beams(:,9));
    rail_beams = rail_beams(I,:);

    start_x = min(rail_beams(:,9));
    end_x   = max(rail_beams(:,10));

    train_x = start_x + (end_x - start_x)*t; % begin of the train
    
    % https://de.wikipedia.org/wiki/ICE_4
    %train_size = 12;
    %waggon_length = 346*1000 / train_size;
    %Fwaggon = -787*9.81 / train_size / 2 / 2;
    
    % http://www.fragdienachbarn.org/wie_lang_und_schwer_ist_ein_zug.html
    % Güterzug
    train_size = 3;
    waggon_length = 20*1000; % 20m
    Fwaggon = -35*9.81*2; % 35t
    %Fwaggon = -100*9.81;

    train_chain = zeros(1,train_size*2);
    for w = 1:train_size
        front = train_x - waggon_length*(w-1);
        train_chain(w*2-1) = front - waggon_length*0.1;
        train_chain(w*2)   = front - waggon_length*0.9;
    end
    
    %train_chain = linspace(train_x - train_size*waggon_length, train_x, train_size)

    for crnt_x = train_chain
        for e = 1:size(rail_beams,1)
            railway_beam = rail_beams(e,:);
            beam_start = railway_beam(9);
            beam_end   = railway_beam(10);
            if beam_start <= crnt_x && crnt_x < beam_end
                pos_on_beam = (crnt_x - beam_start)/(beam_end - beam_start);

                nodes(railway_beam(2),5) = nodes(railway_beam(2),5) + Fwaggon*(1-pos_on_beam);
                nodes(railway_beam(3),5) = nodes(railway_beam(3),5) + Fwaggon*pos_on_beam;
                break;
            end
        end
    end

    % call solver
    [u,F] = solver(nodes,beams);

    % postprocessing
    result = postprocessor(node_pos,beams,u,F);
    
    all_stress(k) = max(abs(result(:,4)));
    
    fig = gcf;
    fig.PaperUnits = 'centimeters';
    fig.InvertHardcopy = 'off';
    fig.PaperPosition = [0 0 60 60];
    %print(['output/ice/',num2str(k),'.png'],'-dpng','-r72');
    print(['output/gueterzug/',num2str(k),'.png'],'-dpng','-r72');
    %print(['output/eigengewicht.png'],'-dpng','-r72');
    pause(1);
    clf;
end

return;

plot(1:size(all_stress,2),all_stress,'k','LineWidth',1);
xlabel('Zeitschritt');
ylabel('Spannung');

set(gca,'Color',[1,1,1]); % set background to white

fig = gcf;
fig.PaperUnits = 'centimeters';
fig.InvertHardcopy = 'on';
fig.PaperPosition = [0 0 10 10];
print(['output/stress_over_time_gueter.png'],'-dpng','-r300');
