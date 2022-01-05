close all;
clear;
clc;

n = 100;

A = rand(n);
b = rand(n,1);

x_ = A\b;

for i = 1:n
    P = eye(n);
    for j = i+1:n
        P(j,i) = - A(j,i)/A(i,i);
    end
    A = P * A;
    b = P * b;
end

x = back_substitution(A,b);

norm(x - x_)

