close all;
clear;
clc;

RED    = sscanf('f2869f','%2x%2x%2x',[1 3])/255;
DARKRED= sscanf('e2005c','%2x%2x%2x',[1 3])/255;
GREEN  = sscanf('55c48f','%2x%2x%2x',[1 3])/255;
YELLOW = sscanf('f4c237','%2x%2x%2x',[1 3])/255;
PURPLE = sscanf('6c1eaf','%2x%2x%2x',[1 3])/255;

K = 50;

delta = 1/5 % Genesungsrate (Kehrwert ist die mittlere Genesungszeit)
mu = 1/5 % Inkubationsrate (Kehrwert ist die Inkubationszeit)
%R0 = (2.4 + 3.3)/2;
R0 = (1.4 + 5.7)/2;


% Masern
%delta = 1/10;
%mu = 1/9;
%R0 = 15;


% Polio
%delta = 1/7.5;
%mu = 1/3;
%R0 = 6;



gamma = R0 * (1/(1/delta + 1/mu)) % Infektionsrate


res = 1/10;

S = zeros(1,K/res);
E = zeros(1,K/res);
I = zeros(1,K/res);
R = zeros(1,K/res);

E(1) = 0.01;
S(1) = 1 - E(1);


delta = delta * res;
mu = mu * res;
gamma = gamma * res;

for k = 1:(K/res)-1
    S(k+1) = S(k) - gamma*S(k)*( E(k) + I(k) );
    E(k+1) = E(k) + gamma*S(k)*( E(k) + I(k) ) - mu*E(k);
    %S(k+1) = S(k) - gamma*S(k)*E(k);
    %E(k+1) = E(k) + gamma*S(k)*E(k)            - mu*E(k);
    
    I(k+1) = I(k)                              + mu*E(k) - delta*I(k);
    R(k+1) = R(k)                                        + delta*I(k);
end

hold on;
area([1:K/res]*res, I+E+R+S, 'LineStyle','none', 'FaceColor',GREEN);
area([1:K/res]*res, I+E+R,   'LineStyle','none', 'FaceColor',YELLOW);
area([1:K/res]*res, I+E,     'LineStyle','none', 'FaceColor',DARKRED);
area([1:K/res]*res, E,       'LineStyle','none', 'FaceColor',RED);
hold off;

axis([0 K 0 1]);

legend('Gesunde', 'Immune', 'Kranke', 'Infizierte');
legend('boxoff');
legend('Location','northoutside');
xlabel('Zeitschritte');
ylabel('Anzahl Individuuen');

fig = gcf;
fig.PaperUnits = 'centimeters';
fig.PaperPosition = [0 0 12 9];
print(['corona.png'],'-dpng','-r300');

