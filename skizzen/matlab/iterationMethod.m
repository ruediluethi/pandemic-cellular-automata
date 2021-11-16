function [x,err,duration] = iterationMethod(A, b, x0, N, method)

    [n,m] = size(A);
    if n ~= m
        error('Matrix ist nicht quadratisch!');
    end
    
    for i = 1:n
        if sum(A(i,[1:i-1,i+1:n])) >= A(i,i)
            error('Matrix ist nicht diagonaldominant!');
        end
    end

    D = diag(diag(A));
    L = tril(A) - D;
    %R = triu(A) - D
    
    B = zeros(n);
    
    % Jacobi
    if strcmp(method,'J')
        B = D;
    
    % Gauß-Seidel
    elseif strcmp(method,'GS')
        B = L+D;
        
    else
        error('Methode nicht gefunden! Es kann aus [GS,J] gewählt werden.');
    end
    
    x_acc = A\b; % exakte Lösung bestimmen
    
    % Inverses Berechnen für die formale Vorschrift (nicht notwendig)
    %invB = inv(B);
    %I = eye(n);
   
    
    err = zeros(1,N);
    x = x0;
    
    %C = (I - invB*A);
    %d = invB*b;
   
    %spy(C)
    %pause;
    
    %rho = max(abs(eig(C))) % Spektralradius
    %L = norm(C,Inf) % Matrixnorm
    
    duration = zeros(1,N);
    tic;
    for k = 1:N
        
        % Formale Iterationsvorschrift
        %x = C*x + d;
        
        x_next = zeros(n,1);
        
        % Jacobi (Gesamt-Schritt-Verfahren)
        if strcmp(method,'J')
            for i = 1:n % Zeilenweise
                x_next(i) = ( -A(i,[1:i-1,i+1:n])*x([1:i-1,i+1:n]) ...
                              + b(i) ) / A(i,i);
            end

        % Gauß-Seidel (Einzel-Schritt-Verfahren)
        elseif strcmp(method,'GS')
            %x_next = C*x + d;
            for i = 1:n % Zeilenweise
                x_next(i) = ( -A(i,1:i-1)*x_next(1:i-1) ...
                              -A(i,i+1:n)*x(i+1:n) ...
                              + b(i) ) / A(i,i);
            end
        end
        
        x = x_next;
            
        err(k) = norm(x_acc - x);
        duration(k) = toc;
        
        if k == 1
            x1 = x;
        end
    end
    
end