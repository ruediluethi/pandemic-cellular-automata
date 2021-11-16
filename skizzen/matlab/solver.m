function [u,F] = solver(nodes,beams,iterations)
    if nargin < 3
        iterations = 0;
    end

    amount_of_nodes = size(nodes,1);
    amount_of_beams = size(beams,1);

    variance = 2; % number of degrees of freedom
    n   = amount_of_nodes * variance;
    K   = zeros(n,n);

    % loop through nodes
    filter_list = 1:n;
    F = zeros(n,1);
    for k = 1:amount_of_nodes
        node  = nodes(k,:);
        Fe    = [node(4),node(5)]; % external forces
        locks = [node(6),node(7)]; % is direction locked?
        for e = 1:variance
            i = k*variance-variance + e;
            F(i) = Fe(e);
            % boundary conditions
            if locks(e) 
                I = find(filter_list == i);
                filter_list = filter_list([1:I-1,I+1:end]);
            end
        end
    end
    
    % create matrix per element
    for e = 1:amount_of_beams

        % get nodes
        a = beams(e,2); % number of start node
        b = beams(e,3); % number of end node
        
        % get constants
        A   = beams(e,4); % area
        Y   = beams(e,5); % Young's Module
        % allready calced vars:
        L   = beams(e,7); % length
        phi = beams(e,8); % angle

        % calc sin and cos
        c = cos(phi);
        s = sin(phi);
        D = Y*A/L;

        % stiffness matrix
        Ke = D * [ c^2   c*s  -c^2  -c*s  ;
                   c*s   s^2  -c*s  -s^2  ;
                  -c^2  -c*s   c^2   c*s  ;
                  -c*s  -s^2   c*s   s^2  ];


        % calc global node index
        index_list = [a * 2 - 1, a * 2, b * 2 - 1, b * 2];
        for i = 1:4
            for j = 1:4
                K(index_list(i),index_list(j)) = K(index_list(i),index_list(j)) + Ke(i,j);
            end
        end

    end
    
    %K

    
    %spy(abs(K) > 1e-10)

    F_part = F(filter_list);
    K_part = K(filter_list,filter_list);
    lambda = eig(K_part);
    kappa = max(lambda)/min(lambda);

    %K_part
    
    u_part = zeros(n,1);
    if iterations == 0
        u_part = K_part\F_part;
    else
        u_part = iterationMethod(K_part,F_part,u_part,iterations,'GS');
    end
    
    %u_part
    
    u = zeros(n,1);
    for e = 1:length(filter_list)
        % append calced shifts to node positions
        u(filter_list(e)) = u_part(e);
    end

    F = K*u;
end