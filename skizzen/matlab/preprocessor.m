function [node_pos,beams] = preprocessor(nodes,beams)
    
    % create vector with all node positions
    amount_of_nodes = size(nodes,1);
    variance = 2; % number of degrees of freedom
    n   = amount_of_nodes * variance;
    node_pos = zeros(n,1);
    for k = 1:amount_of_nodes
        node    = nodes(k,:);
        pos     = [node(2),node(3)]; % position
        for e = 1:variance
            i = k*variance-variance + e;
            node_pos(i) = pos(e);
        end
    end
    
    % calc length and angle for every beam
    for e = 1:size(beams,1)
        % get nodes
        a = beams(e,2); % number of start node
        b = beams(e,3); % number of end node
        node_start = nodes(a,:);
        node_end   = nodes(b,:);
        % calc phi and length
        delta_x = node_end(2) - node_start(2);
        delta_y = node_end(3) - node_start(3);
        beams(e,7) = sqrt(delta_x^2 + delta_y^2); % beam length
        beams(e,8) = atan2(delta_y, delta_x);     % angle
    end

end