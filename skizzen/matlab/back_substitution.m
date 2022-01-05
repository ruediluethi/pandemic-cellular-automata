function x = back_substitution(R,b)
    
    n = size(b,1);
    
    x = zeros(n,1);
    for i = n:-1:1
        x(i) = b(i);
        for j = i+1:n
            x(i) = x(i) - R(i,j)*x(j);
        end
        x(i) = x(i)/R(i,i);
    end

end