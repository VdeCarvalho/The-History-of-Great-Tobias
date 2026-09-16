window.TobiasVillage = (() => {
  const point = (x,y) => ({x:x/1448,y:y/1086});
  const residents = [
    ['bento','Bento',430,873,0,0,6.2,175,'carpenter',['Ufa! Uma cadeira firme começa com muita paciência.','Estou fazendo um banquinho novo para a praça.']],
    ['flora','Flora',1275,604,0,1,5.7,265,'fruit',['Bom dia, Tobias! As maçãs estão docinhas hoje.','Uma cenoura crocante melhora qualquer passeio.']],
    ['augusto','Sr. Augusto',1208,314,0,2,6.1,145,'watch',['Ora, ora... já está na hora do meu chá!','Meu relógio vale muitas cenouras. Mas não compra uma tarde tranquila.']],
    ['lila','Lila',735,869,0,3,4.7,390,'kite',['Olha a minha pipa, Tobias! Ela quase encosta nas nuvens!','Quando crescer, quero fazer uma pipa do tamanho de uma casa.']],
    ['nico','Nico',1158,339,1,0,6.1,210,'delivery',['Com licença! Cenouras fresquinhas passando!','Do banco até a feira... minhas pernas já sabem o caminho.']],
    ['celeste','Dona Celeste',471,692,1,1,5.8,235,'knit',['Sua mãe ficaria linda com um cachecol novo, não acha?','Sente um pouquinho. As melhores histórias não têm pressa.']],
    ['paco','Paco',241,292,1,2,6.0,285,'bread',['O pão acabou de sair do forno! Cuidado para não queimar o focinho.','Minha receita secreta? Um pouquinho de mel e muita manteiga.']],
    ['iris','Íris',1110,659,1,3,5.9,300,'water',['As flores também gostam de uma boa conversa.','A trilha ao norte anda silenciosa demais... prefiro cuidar daqui.']],
    ['teo','Téo',780,688,2,0,4.7,365,'wave',['Tobias! Aposto que você não encontra uma pedra mais redonda que a minha!','A Lila disse que a pipa dela viu a vila inteira.']],
    ['clara','Clara',509,307,2,1,5.8,250,'letter',['Uma carta para cá, outra para lá... bom te ver, Tobias!','Hoje só tenho notícias boas na bolsa.']],
    ['pingo','Pingo',1048,520,2,2,3.2,420,'dog',['au au']],
    ['rosinha','Rosinha',463,483,2,3,3.1,155,'pig',['oinc, oinc!']]
  ].map(([id,name,x,y,atlas,row,size,pitch,job,lines])=>({id,name,...point(x,y),atlas,row,size,pitch,job,lines,sideRight:atlas===2&&row!==2}));
  const blocks = [
    [92,36,274,226],[346,202,168,71],[586,211,72,39],[803,191,215,89],
    [1028,58,363,222],[1089,263,75,36],
    [105,321,246,244],[344,376,242,193],[122,594,89,45],
    [548,286,112,145],[947,288,109,121],
    [610,566,143,128],[948,571,139,126],
    [1190,390,204,189],[1067,480,26,38],
    [75,664,340,247],[246,914,107,39],[1172,635,199,249],
    [1093,775,84,150],[1174,899,94,47],
    [506,752,126,68],[829,749,132,70],[515,873,116,79],[826,882,136,70]
  ];
  const garden = p => p.x>344/1448&&p.x<586/1448&&p.y>376/1086&&p.y<569/1086;
  const posts=[[527,259],[674,373],[1058,337],[1146,443],[97,623],[418,840],[1074,832],[181,956]];
  const benches=[[[719,429],[767,400],[782,421],[732,450]],[[926,401],[980,427],[975,447],[920,422]],[[727,562],[782,592],[776,615],[721,585]],[[938,587],[986,554],[994,575],[944,611]]];
  return {width:4096,height:3072,background:'village-hd.webp',mask:'village_walkable.png?v=hd-fix1',residents,blocks,posts,benches,
    garden,region:p=>garden(p)?'garden':'street',
    spawn:{street:point(279,594),garden:point(392,473),forest:point(711,199)},
    home:point(279,548),sideDoor:point(366,463),north:point(713,115),
    occluders:blocks.filter(([x,y])=>x!==344||y!==376).concat([[344,376,242,30],[344,376,22,193],[560,376,26,193],[344,527,242,42],[710,393,72,57],[916,391,70,55],[723,556,70,62],[929,550,66,64]]),
    deliveryRoute:[[1158,339],[1125,398],[1125,559],[1190,604]].map(([x,y])=>point(x,y))};
})();
