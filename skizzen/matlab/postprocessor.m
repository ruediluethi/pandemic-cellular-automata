function [results] = postprocessor(node_pos,beams,u,F,alpha,plot_original_state)
    if nargin < 5
        alpha = 1;
    end
    if nargin < 6
        plot_original_state = 1;
    end
    
    amount_of_beams = size(beams,1);

    results = zeros(amount_of_beams,5);

    % calc stress
    max_stress = 0;
    for e = 1:amount_of_beams
        % get nodes
        a = beams(e,2); % number of start node
        b = beams(e,3); % number of end node
        A   = beams(e,4); % area
        Y   = beams(e,5); % Young's Module
        L   = beams(e,7); % length
        phi = beams(e,8); % angle
        uxa = u(a*2-1);
        uya = u(a*2);
        uxb = u(b*2-1);
        uyb = u(b*2);
        % displacements along beam direction
        ua = uxa*cos(phi) + uya*sin(phi);
        ub = uxb*cos(phi) + uyb*sin(phi);
        ue = ub - ua;
        epsilon = ue/L;        % strain
        sigma   = Y * epsilon; % stress
        Fbeam   = sigma * A;
        
        % save it in beam vector
        beams(e,9) = sigma;
        
        % save it all to result vector
        results(e,1) = e;       % beam number
        results(e,2) = ue;      % full displacement along beam direction
        results(e,3) = epsilon; % strain
        results(e,4) = sigma;   % stress
        results(e,5) = Fbeam;   % force
        
        % choose max_stress
        if max_stress < abs(sigma)
            max_stress = abs(sigma);
        end
    end
    
    max_stress = 30;
    %sicherheitsfaktor = 2;
    %max_stress = 240e-3 / sicherheitsfaktor;
    
    %disp(['MAX STRESS: ',num2str(max_stress)]);
    
    % display stuff:
    hold on;
    % plot original state
    if plot_original_state
        plot_beams(node_pos,beams,'k');
        %plot_nodes(node_pos,'ok',[1,1,1]);
    end
    set(gca,'Color',[230/256,230/256,230/256]); % set background to gray
    
   
    % set environment size
    n = length(node_pos);
    x = 1:2:n;
    y = 2:2:n;
    x_min = min(node_pos(x));
    x_max = max(node_pos(x));
    y_min = min(node_pos(y));
    y_max = max(node_pos(y));
    delta_x = abs(x_max - x_min);
    delta_y = abs(y_max - y_min);
    
    env_size = delta_x;
    if delta_x > delta_y
        padding_x = delta_x*0.2;
        padding_y = (delta_x - delta_y)/2 + padding_x;
        axis([x_min-padding_x x_min+delta_x+padding_x y_min-padding_y y_min+delta_y+padding_y]);
    end
    
    %node_pos = [node_pos(1),node_pos(2),node_pos(1:end)']
    %F_init = [1,0,0,1,0,1,0,0,0,-2]
    %plot_loads(node_pos,F_init,env_size);
    %return;

    % add displacements to the node positions
    node_pos = node_pos + u; 
    % plot altered state
    plot_beams(node_pos,beams,'k',max_stress,alpha);
    %plot_nodes(node_pos,'ok',[0.2,0.2,0.2]);
    %plot_loads(node_pos,F,env_size);

    hold off;
end

function plot_nodes(node_pos,sign,color)
    n = length(node_pos);
    x = 1:2:n;
    y = 2:2:n;
    plot(node_pos(x),node_pos(y),sign,'MarkerFaceColor',color,'MarkerEdgeColor','none');
end

function plot_beams(node_pos,beams,line,max_stress,alpha)
    if nargin < 4
        alpha = 1;
    end

    % HACK: is there no way to define global const?
    GREEN = [ 77/256,175/256, 20/256, alpha];
    RED   = [232/256, 55/256, 15/256, alpha];
    BLUE  = [109/256, 26/256,216/256, alpha];
    
    amount_of_beams = size(beams,1);
    for e = 1:amount_of_beams
        % get nodes
        a = beams(e,2); % number of start node
        b = beams(e,3); % number of end node
        
        % line color
        line_color = [1,1,1,alpha];
        
        line_width = 4;
        % calc color: green no stress, red pos., blue neg.
        if nargin > 3 % if stress is set
            stress = beams(e,9);
            normalized_stress = abs(stress/max_stress);
            if normalized_stress > 1
                normalized_stress = 1;
                %line_width = 1;
            end
            
            if stress < 0
                line_color = interpolate_color(GREEN,RED,normalized_stress);
            else
                line_color = interpolate_color(GREEN,BLUE,normalized_stress);
            end
        end
        
        % plot beam
        plot([node_pos(a*2-1),node_pos(b*2-1)],[node_pos(a*2),node_pos(b*2)],line,'Color',line_color,'LineWidth',line_width);
    end
end

function plot_loads(node_pos,F,env_size)
    n = length(F)/2;
    %arrow_length = env_size/1000*0.1;
    arrow_length = env_size/50000;
    %arrow_length = env_size/max(F)*0.1;
    for e = 1:n
        i = e*2; 
        quiver(node_pos(i-1),node_pos(i),F(i-1),F(i),arrow_length,'k','MaxHeadSize',10,'LineWidth',2);
    end
end

function C = interpolate_color(A,B,value)
    dr = B(1) - A(1);
    dg = B(2) - A(2);
    db = B(3) - A(3);
    da = B(4) - A(4);
    C = [A(1)+dr*value,A(2)+dg*value,A(3)+db*value,A(4)+da*value];
end