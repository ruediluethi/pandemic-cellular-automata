close all;
clear;
clc;


P = 2000;
%N = 200*200;
N = P*0.4;

%R0 = (2.4 + 3.3)/2
R0 = 3;

%a = 1/5; % Inkubationszeit
%b = 1/3; % mittlere Zeit mit Symptomen

a = 1/2;
b = 1/5;

% R0 = k * r * D 
% k is the number of contacts each infectious individual has per unit time
k = P/N
% D is the mean duration of infectiousness.
D = 1/a + 1/b;
% r is the probability of transmission per contact between an infectious case and a susceptible person
r = R0 / (k*D)

acc = 0.2;

%r = 0.2;
%b = 0.3;
%a = 0.4;

a = a * acc;
b = b * acc;
r = r * acc;

K = 50 / acc;
dt = 1;
S = zeros(1,K/dt);
E = zeros(1,K/dt);
I = zeros(1,K/dt);
R = zeros(1,K/dt);

E(1) = P*0.01;
S(1) = P - E(1);
I(1) = 0;
R(1) = 0;

S_uni = zeros(1,K);
E_uni = zeros(1,K);
I_uni = zeros(1,K);
R_uni = zeros(1,K);

S_uni(1) = S(1);
E_uni(1) = E(1);
I_uni(1) = I(1);
R_uni(1) = R(1);
    
for k = 1:K-1
    %disp(k);
    
    for i = 1:1/dt
        k_ = (k-1)/dt+i;
        % Differenzengleichungen
        delta_E = S(k_) * ( 1 - (1 - r)^((E(k_) + I(k_))/N) ) * dt; % neu infizierte
        delta_I = a*E(k_) * dt; % zeigen neu symptome
        delta_R = b*I(k_) * dt; % anzahl genesene
        S(k_+1) = S(k_) - delta_E           ;
        E(k_+1) = E(k_) + delta_E - delta_I ;
        I(k_+1) = I(k_)           + delta_I - delta_R ;
        R(k_+1) = R(k_)                     + delta_R ;
    end
    
    % verteile die individuen zufällig auf die zellen
    C = zeros(N,4);
    A = [S_uni(k), E_uni(k), I_uni(k), R_uni(k)];
    for i = 1:4
        for j = 1:A(i)
            randCellNr = randi(N);
            C(randCellNr,i) = C(randCellNr,i)+1;
        end
    end
    
    % kalkuliere der w'keiten
    % und zählen der Individuen
    S_uni(k+1) = 0;
    E_uni(k+1) = 0;
    I_uni(k+1) = 0;
    R_uni(k+1) = 0;
    for j = 1:N
        
        % für jeden gesunden
        iS = C(j,1);
        for s = 1:iS
            
            % wird für jeden infizierten mit/ohne symptome
            for i = 1:( C(j,2) + C(j,3) )
            
                if rand() < r % kalkuliert ob er sich infiziert
                    C(j,1) = C(j,1)-1;
                    C(j,2) = C(j,2)+1;
                end
            end
        end
        
        % krankheit bricht aus
        iE = C(j,2);
        for i = 1:iE
            if rand() < a
                C(j,2) = C(j,2)-1;
                C(j,3) = C(j,3)+1;
            end
        end    
        
        % genesen
        iI = C(j,3);
        for i = 1:iI
            if rand() < b
                C(j,3) = C(j,3)-1;
                C(j,4) = C(j,4)+1;
            end
        end            

        % zählen
        S_uni(k+1) = S_uni(k+1) + C(j,1);
        E_uni(k+1) = E_uni(k+1) + C(j,2);
        I_uni(k+1) = I_uni(k+1) + C(j,3);
        R_uni(k+1) = R_uni(k+1) + C(j,4);
    end
    
end

hold on;


RED    = sscanf('f2869f','%2x%2x%2x',[1 3])/255;
DARKRED= sscanf('e2005c','%2x%2x%2x',[1 3])/255;
GREEN  = sscanf('55c48f','%2x%2x%2x',[1 3])/255;
YELLOW = sscanf('f4c237','%2x%2x%2x',[1 3])/255;
PURPLE = sscanf('6c1eaf','%2x%2x%2x',[1 3])/255;

area([1:K]*acc,S+E+I+R,'LineStyle','none', 'FaceColor',GREEN);
area([1:K]*acc,E+I+R,  'LineStyle','none', 'FaceColor',YELLOW);
area([1:K]*acc,E+I,      'LineStyle','none', 'FaceColor',RED);
area([1:K]*acc,I,    'LineStyle','none', 'FaceColor',DARKRED);


plot([1:K]*acc,S_uni+E_uni+I_uni+R_uni, 'w:','LineWidth',1.5);
plot([1:K]*acc,      E_uni+I_uni+R_uni, 'w:','LineWidth',1.5);
plot([1:K]*acc,      E_uni+I_uni,       'w:','LineWidth',1.5);
plot([1:K]*acc,      I_uni,             'w:','LineWidth',1.5);

axis([0 K*acc 0 P+1]);

legend('Gesunde', 'Immune', 'Kranke', 'Infizierte');
legend('boxoff');
legend('Location','northoutside');
xlabel('Zeitschritte');
ylabel('Anzahl Individuuen');

fig = gcf;
fig.PaperUnits = 'centimeters';
fig.PaperPosition = [0 0 10 10];
print(['diff_vs_randomauto.png'],'-dpng','-r300');
