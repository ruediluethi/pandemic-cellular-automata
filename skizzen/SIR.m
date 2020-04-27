close all;
clear;
clc;

RED    = sscanf('f2869f','%2x%2x%2x',[1 3])/255;
DARKRED= sscanf('e2005c','%2x%2x%2x',[1 3])/255;
GREEN  = sscanf('55c48f','%2x%2x%2x',[1 3])/255;
YELLOW = sscanf('f4c237','%2x%2x%2x',[1 3])/255;
PURPLE = sscanf('6c1eaf','%2x%2x%2x',[1 3])/255;

K = 50;

delta = 1/8 % Genesungsrate (Kehrwert ist die mittlere Genesungszeit)
R0 = (2.4 + 3.3)/2;
gamma = R0 * delta % Infektionsrate


S = zeros(1,K);
I = zeros(1,K);
R = zeros(1,K);

I(1) = 0.01;
S(1) = 1 - I(1);

for k = 1:K-1
    S(k+1) = S(k) - gamma*S(k)*I(k);
    I(k+1) = I(k) + gamma*S(k)*I(k) - delta*I(k);
    R(k+1) = R(k)                   + delta*I(k);
end

hold on;
%plot(1:K, S);
%plot(1:K, E);
%plot(1:K, I);
%plot(1:K, R);
area(1:K, I+R+S, 'LineStyle','none', 'FaceColor',GREEN);
area(1:K, I+R,   'LineStyle','none', 'FaceColor',YELLOW);
area(1:K, I,     'LineStyle','none', 'FaceColor',DARKRED);
hold off;

legend('Gesunde', 'Immune', 'Infizierte');
legend('boxoff');
legend('Location','northoutside');
xlabel('Zeitschritte');
ylabel('Anzahl Individuuen');

box off;

axis([0 K 0 1]);

fig = gcf;
fig.PaperUnits = 'centimeters';
fig.PaperPosition = [0 0 10 10];
print(['SIR.png'],'-dpng','-r300');
