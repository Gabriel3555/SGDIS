package com.sgdis.backend;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgdis.backend.data.departaments_cities.entity.CityEntity;
import com.sgdis.backend.data.departaments_cities.entity.DepartamentEntity;
import com.sgdis.backend.data.departaments_cities.repositories.SpringDataCitiesRepository;
import com.sgdis.backend.data.departaments_cities.repositories.SpringDataDepartamentsRepository;
import com.sgdis.backend.data.regional.RegionalEntity;
import com.sgdis.backend.data.regional.repositories.SpringDataRegionalRepository;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
/*
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SpringDataUserRepository userRepository;
    private final SpringDataDepartamentsRepository departamentRepository;
    private final SpringDataCitiesRepository citiesRepository;
    private final SpringDataInventoryRepository inventoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final SpringDataRegionalRepository regionalRepository;

    private static final String SEED = """
[
 { "id": 0, "departamento": "Amazonas", "ciudades": ["Leticia","Puerto Nariño"] },
 { "id": 1, "departamento": "Antioquia", "ciudades": ["Abejorral","Abriaquí","Alejandría","Amagá","Amalfi","Andes","Angelópolis","Angostura","Anorí","Anzá","Apartadó","Arboletes","Argelia","Armenia","Barbosa","Bello","Belmira","Betania","Betulia","Briceño","Buriticá","Cáceres","Caicedo","Caldas","Campamento","Cañasgordas","Caracolí","Caramanta","Carepa","Carolina del Príncipe","Caucasia","Chigorodó","Cisneros","Ciudad Bolívar","Cocorná","Concepción","Concordia","Copacabana","Dabeiba","Donmatías","Ebéjico","El Bagre","El Carmen de Viboral","El Peñol","El Retiro","El Santuario","Entrerríos","Envigado","Fredonia","Frontino","Giraldo","Girardota","Gómez Plata","Granada","Guadalupe","Guarne","Guatapé","Heliconia","Hispania","Itagüí","Ituango","Jardín","Jericó","La Ceja","La Estrella","La Pintada","La Unión","Liborina","Maceo","Marinilla","Medellín","Montebello","Murindó","Mutatá","Nariño","Nechí","Necoclí","Olaya","Peque","Pueblorrico","Puerto Berrío","Puerto Nare","Puerto Triunfo","Remedios","Rionegro","Sabanalarga","Sabaneta","Salgar","San Andrés de Cuerquia","San Carlos","San Francisco","San Jerónimo","San José de la Montaña","San Juan de Urabá","San Luis","San Pedro de Urabá","San Pedro de los Milagros","San Rafael","San Roque","San Vicente","Santa Bárbara","Santa Fe de Antioquia","Santa Rosa de Osos","Santo Domingo","Segovia","Sonsón","Sopetrán","Támesis","Tarazá","Tarso","Titiribí","Toledo","Turbo","Uramita","Urrao","Valdivia","Valparaíso","Vegachí","Venecia","Vigía del Fuerte","Yalí","Yarumal","Yolombó","Yondó","Zaragoza"] },
 { "id": 2, "departamento": "Arauca", "ciudades": ["Arauca","Arauquita","Cravo Norte","Fortul","Puerto Rondón","Saravena","Tame"] },
 { "id": 3, "departamento": "Atlántico", "ciudades": ["Baranoa","Barranquilla","Campo de la Cruz","Candelaria","Galapa","Juan de Acosta","Luruaco","Malambo","Manatí","Palmar de Varela","Piojó","Polonuevo","Ponedera","Puerto Colombia","Repelón","Sabanagrande","Sabanalarga","Santa Lucía","Santo Tomás","Soledad","Suán","Tubará","Usiacurí"] },
 { "id": 4, "departamento": "Bolívar", "ciudades": ["Achí","Altos del Rosario","Arenal","Arjona","Arroyohondo","Barranco de Loba","Brazuelo de Papayal","Calamar","Cantagallo","Cartagena de Indias","Cicuco","Clemencia","Córdoba","El Carmen de Bolívar","El Guamo","El Peñón","Hatillo de Loba","Magangué","Mahates","Margarita","María la Baja","Mompós","Montecristo","Morales","Norosí","Pinillos","Regidor","Río Viejo","San Cristóbal","San Estanislao","San Fernando","San Jacinto del Cauca","San Jacinto","San Juan Nepomuceno","San Martín de Loba","San Pablo","Santa Catalina","Santa Rosa","Santa Rosa del Sur","Simití","Soplaviento","Talaigua Nuevo","Tiquisio","Turbaco","Turbaná","Villanueva","Zambrano"] },
 { "id": 5, "departamento": "Boyacá", "ciudades": ["Almeida","Aquitania","Arcabuco","Belén","Berbeo","Betéitiva","Boavita","Boyacá","Briceño","Buenavista","Busbanzá","Caldas","Campohermoso","Cerinza","Chinavita","Chiquinquirá","Chíquiza","Chiscas","Chita","Chitaraque","Chivatá","Chivor","Ciénega","Cómbita","Coper","Corrales","Covarachía","Cubará","Cucaita","Cuítiva","Duitama","El Cocuy","El Espino","Firavitoba","Floresta","Gachantivá","Gámeza","Garagoa","Guacamayas","Guateque","Guayatá","Güicán","Iza","Jenesano","Jericó","La Capilla","La Uvita","La Victoria","Labranzagrande","Macanal","Maripí","Miraflores","Mongua","Monguí","Moniquirá","Motavita","Muzo","Nobsa","Nuevo Colón","Oicatá","Otanche","Pachavita","Páez","Paipa","Pajarito","Panqueba","Pauna","Paya","Paz del Río","Pesca","Pisba","Puerto Boyacá","Quípama","Ramiriquí","Ráquira","Rondón","Saboyá","Sáchica","Samacá","San Eduardo","San José de Pare","San Luis de Gaceno","San Mateo","San Miguel de Sema","San Pablo de Borbur","Santa María","Santa Rosa de Viterbo","Santa Sofía","Santana","Sativanorte","Sativasur","Siachoque","Soatá","Socha","Socotá","Sogamoso","Somondoco","Sora","Soracá","Sotaquirá","Susacón","Sutamarchán","Sutatenza","Tasco","Tenza","Tibaná","Tibasosa","Tinjacá","Tipacoque","Toca","Togüí","Tópaga","Tota","Tunja","Tununguá","Turmequé","Tuta","Tutazá","Úmbita","Ventaquemada","Villa de Leyva","Viracachá","Zetaquira"] },
 { "id": 6, "departamento": "Caldas", "ciudades": ["Aguadas","Anserma","Aranzazu","Belalcázar","Chinchiná","Filadelfia","La Dorada","La Merced","Manizales","Manzanares","Marmato","Marquetalia","Marulanda","Neira","Norcasia","Pácora","Palestina","Pensilvania","Riosucio","Risaralda","Salamina","Samaná","San José","Supía","Victoria","Villamaría","Viterbo"] },
 { "id": 7, "departamento": "Caquetá", "ciudades": ["Albania","Belén de los Andaquíes","Cartagena del Chairá","Curillo","El Doncello","El Paujil","Florencia","La Montañita","Milán","Morelia","Puerto Rico","San José del Fragua","San Vicente del Caguán","Solano","Solita","Valparaíso"] },
 { "id": 8, "departamento": "Casanare", "ciudades": ["Aguazul","Chámeza","Hato Corozal","La Salina","Maní","Monterrey","Nunchía","Orocué","Paz de Ariporo","Pore","Recetor","Sabanalarga","Sácama","San Luis de Palenque","Támara","Tauramena","Trinidad","Villanueva","Yopal"] },
 { "id": 9, "departamento": "Cauca", "ciudades": ["Almaguer","Argelia","Balboa","Bolívar","Buenos Aires","Cajibío","Caldono","Caloto","Corinto","El Tambo","Florencia","Guachené","Guapí","Inzá","Jambaló","La Sierra","La Vega","López de Micay","Mercaderes","Miranda","Morales","Padilla","Páez","Patía","Piamonte","Piendamó","Popayán","Puerto Tejada","Puracé","Rosas","San Sebastián","Santa Rosa","Santander de Quilichao","Silvia","Sotará","Suárez","Sucre","Timbío","Timbiquí","Toribío","Totoró","Villa Rica"] },
 { "id": 10, "departamento": "Cesar", "ciudades": ["Aguachica","Agustín Codazzi","Astrea","Becerril","Bosconia","Chimichagua","Chiriguaná","Curumaní","El Copey","El Paso","Gamarra","González","La Gloria (Cesar)","La Jagua de Ibirico","La Paz","Manaure Balcón del Cesar","Pailitas","Pelaya","Pueblo Bello","Río de Oro","San Alberto","San Diego","San Martín","Tamalameque","Valledupar"] },
 { "id": 11, "departamento": "Chocó", "ciudades": ["Acandí","Alto Baudó","Bagadó","Bahía Solano","Bajo Baudó","Bojayá","Cantón de San Pablo","Cértegui","Condoto","El Atrato","El Carmen de Atrato","El Carmen del Darién","Istmina","Juradó","Litoral de San Juan","Lloró","Medio Atrato","Medio Baudó","Medio San Juan","Nóvita","Nuquí","Quibdó","Río Iró","Río Quito","Riosucio","San José del Palmar","Sipí","Tadó","Unión Panamericana","Unguía"] },
 { "id": 12, "departamento": "Cundinamarca", "ciudades": ["Agua de Dios","Albán","Anapoima","Anolaima","Apulo","Arbeláez","Beltrán","Bituima","Bogotá","Bojacá","Cabrera","Cachipay","Cajicá","Caparrapí","Cáqueza","Carmen de Carupa","Chaguaní","Chía","Chipaque","Choachí","Chocontá","Cogua","Cota","Cucunubá","El Colegio","El Peñón","El Rosal","Facatativá","Fómeque","Fosca","Funza","Fúquene","Fusagasugá","Gachalá","Gachancipá","Gachetá","Gama","Girardot","Granada","Guachetá","Guaduas","Guasca","Guataquí","Guatavita","Guayabal de Síquima","Guayabetal","Gutiérrez","Jerusalén","Junín","La Calera","La Mesa","La Palma","La Peña","La Vega","Lenguazaque","Machetá","Madrid","Manta","Medina","Mosquera","Nariño","Nemocón","Nilo","Nimaima","Nocaima","Pacho","Paime","Pandi","Paratebueno","Pasca","Puerto Salgar","Pulí","Quebradanegra","Quetame","Quipile","Ricaurte","San Antonio del Tequendama","San Bernardo","San Cayetano","San Francisco","San Juan de Rioseco","Sasaima","Sesquilé","Sibaté","Silvania","Simijaca","Soacha","Sopó","Subachoque","Suesca","Supatá","Susa","Sutatausa","Tabio","Tausa","Tena","Tenjo","Tibacuy","Tibirita","Tocaima","Tocancipá","Topaipí","Ubalá","Ubaque","Ubaté","Une","Útica","Venecia","Vergara","Vianí","Villagómez","Villapinzón","Villeta","Viotá","Yacopí","Zipacón","Zipaquirá"] },
 { "id": 13, "departamento": "Córdoba", "ciudades": ["Ayapel","Buenavista","Canalete","Cereté","Chimá","Chinú","Ciénaga de Oro","Cotorra","La Apartada","Lorica","Los Córdobas","Momil","Montelíbano","Montería","Moñitos","Planeta Rica","Pueblo Nuevo","Puerto Escondido","Puerto Libertador","Purísima","Sahagún","San Andrés de Sotavento","San Antero","San Bernardo del Viento","San Carlos","San José de Uré","San Pelayo","Tierralta","Tuchín","Valencia"] },
 { "id": 14, "departamento": "Guainía", "ciudades": ["Inírida"] },
 { "id": 15, "departamento": "Guaviare", "ciudades": ["Calamar","El Retorno","Miraflores","San José del Guaviare"] },
 { "id": 16, "departamento": "Huila", "ciudades": ["Acevedo","Agrado","Aipe","Algeciras","Altamira","Baraya","Campoalegre","Colombia","El Pital","Elías","Garzón","Gigante","Guadalupe","Hobo","Íquira","Isnos","La Argentina","La Plata","Nátaga","Neiva","Oporapa","Paicol","Palermo","Palestina","Pitalito","Rivera","Saladoblanco","San Agustín","Santa María","Suaza","Tarqui","Tello","Teruel","Tesalia","Timaná","Villavieja","Yaguará"] },
 { "id": 17, "departamento": "La Guajira", "ciudades": ["Albania","Barrancas","Dibulla","Distracción","El Molino","Fonseca","Hatonuevo","La Jagua del Pilar","Maicao","Manaure","Riohacha","San Juan del Cesar","Uribia","Urumita","Villanueva"] },
 { "id": 18, "departamento": "Magdalena", "ciudades": ["Algarrobo","Aracataca","Ariguaní","Cerro de San Antonio","Chibolo","Chibolo","Ciénaga","Concordia","El Banco","El Piñón","El Retén","Fundación","Guamal","Nueva Granada","Pedraza","Pijiño del Carmen","Pivijay","Plato","Pueblo Viejo","Remolino","Sabanas de San Ángel","Salamina","San Sebastián de Buenavista","San Zenón","Santa Ana","Santa Bárbara de Pinto","Santa Marta","Sitionuevo","Tenerife","Zapayán","Zona Bananera"] },
 { "id": 19, "departamento": "Meta", "ciudades": ["Acacías","Barranca de Upía","Cabuyaro","Castilla la Nueva","Cubarral","Cumaral","El Calvario","El Castillo","El Dorado","Fuente de Oro","Granada","Guamal","La Macarena","La Uribe","Lejanías","Mapiripán","Mesetas","Puerto Concordia","Puerto Gaitán","Puerto Lleras","Puerto López","Puerto Rico","Restrepo","San Carlos de Guaroa","San Juan de Arama","San Juanito","San Martín","Villavicencio","Vista Hermosa"] },
 { "id": 20, "departamento": "Nariño", "ciudades": ["Aldana","Ancuyá","Arboleda","Barbacoas","Belén","Buesaco","Chachagüí","Colón","Consacá","Contadero","Córdoba","Cuaspud","Cumbal","Cumbitara","El Charco","El Peñol","El Rosario","El Tablón","El Tambo","Francisco Pizarro","Funes","Guachucal","Guaitarilla","Gualmatán","Iles","Imués","Ipiales","La Cruz","La Florida","La Llanada","La Tola","La Unión","Leiva","Linares","Los Andes","Magüí Payán","Mallama","Mosquera","Nariño","Olaya Herrera","Ospina","Pasto","Policarpa","Potosí","Providencia","Puerres","Pupiales","Ricaurte","Roberto Payán","Samaniego","San Bernardo","San José de Albán","San Lorenzo","San Pablo","San Pedro de Cartago","Sandoná","Santa Bárbara","Santacruz","Sapuyes","Taminango","Tangua","Tumaco","Túquerres","Yacuanquer"] },
 { "id": 21, "departamento": "Norte de Santander", "ciudades": ["Ábrego","Arboledas","Bochalema","Bucarasica","Cáchira","Cácota","Chinácota","Chitagá","Convención","Cúcuta","Cucutilla","Duranía","El Carmen","El Tarra","El Zulia","Gramalote","Hacarí","Herrán","La Esperanza","La Playa de Belén","Labateca","Los Patios","Lourdes","Mutiscua","Ocaña","Pamplona","Pamplonita","Puerto Santander","Ragonvalia","Salazar de Las Palmas","San Calixto","San Cayetano","Santiago","Santo Domingo de Silos","Sardinata","Teorama","Tibú","Toledo","Villa Caro","Villa del Rosario"] },
 { "id": 22, "departamento": "Putumayo", "ciudades": ["Colón","Mocoa","Orito","Puerto Asís","Puerto Caicedo","Puerto Guzmán","Puerto Leguízamo","San Francisco","San Miguel","Santiago","Sibundoy","Valle del Guamuez","Villagarzón"] },
 { "id": 23, "departamento": "Quindío", "ciudades": ["Armenia","Buenavista","Calarcá","Circasia","Córdoba","Filandia","Génova","La Tebaida","Montenegro","Pijao","Quimbaya","Salento"] },
 { "id": 24, "departamento": "Risaralda", "ciudades": ["Apía","Balboa","Belén de Umbría","Dosquebradas","Guática","La Celia","La Virginia","Marsella","Mistrató","Pereira","Pueblo Rico","Quinchía","Santa Rosa de Cabal","Santuario"] },
 { "id": 25, "departamento": "San Andrés y Providencia", "ciudades": ["Providencia y Santa Catalina Islas","San Andrés"] },
 { "id": 26, "departamento": "Santander", "ciudades": ["Aguada","Albania","Aratoca","Barbosa","Barichara","Barrancabermeja","Betulia","Bolívar","Bucaramanga","Cabrera","California","Capitanejo","Carcasí","Cepitá","Cerrito","Charalá","Charta","Chima","Chipatá","Cimitarra","Concepción","Confines","Contratación","Coromoro","Curití","El Carmen de Chucurí","El Guacamayo","El Peñón","El Playón","El Socorro","Encino","Enciso","Florián","Floridablanca","Galán","Gámbita","Girón","Guaca","Guadalupe","Guapotá","Guavatá","Güepsa","Hato","Jesús María","Jordán","La Belleza","La Paz","Landázuri","Lebrija","Los Santos","Macaravita","Málaga","Matanza","Mogotes","Molagavita","Ocamonte","Oiba","Onzaga","Palmar","Palmas del Socorro","Páramo","Piedecuesta","Pinchote","Puente Nacional","Puerto Parra","Puerto Wilches","Rionegro","Sabana de Torres","San Andrés","San Benito","San Gil","San Joaquín","San José de Miranda","San Miguel","San Vicente de Chucurí","Santa Bárbara","Santa Helena del Opón","Simacota","Suaita","Sucre","Suratá","Tona","Valle de San José","Vélez","Vetas","Villanueva","Zapatoca"] },
 { "id": 27, "departamento": "Sucre", "ciudades": ["Buenavista","Caimito","Chalán","Colosó","Corozal","Coveñas","El Roble","Galeras","Guaranda","La Unión","Los Palmitos","Majagual","Morroa","Ovejas","Sampués","San Antonio de Palmito","San Benito Abad","San Juan de Betulia","San Marcos","San Onofre","San Pedro","Sincé","Sincelejo","Sucre","Tolú","Tolú Viejo"] },
 { "id": 28, "departamento": "Tolima", "ciudades": ["Alpujarra","Alvarado","Ambalema","Anzoátegui","Armero","Ataco","Cajamarca","Carmen de Apicalá","Casabianca","Chaparral","Coello","Coyaima","Cunday","Dolores","El Espinal","Falán","Flandes","Fresno","Guamo","Herveo","Honda","Ibagué","Icononzo","Lérida","Líbano","Mariquita","Melgar","Murillo","Natagaima","Ortega","Palocabildo","Piedras","Planadas","Prado","Purificación","Rioblanco","Roncesvalles","Rovira","Saldaña","San Antonio","San Luis","Santa Isabel","Suárez","Valle de San Juan","Venadillo","Villahermosa","Villarrica"] },
 { "id": 29, "departamento": "Valle del Cauca", "ciudades": ["Alcalá","Andalucía","Ansermanuevo","Argelia","Bolívar","Buenaventura","Buga","Bugalagrande","Caicedonia","Cali","Calima","Candelaria","Cartago","Dagua","El Águila","El Cairo","El Cerrito","El Dovio","Florida","Ginebra","Guacarí","Jamundí","La Cumbre","La Unión","La Victoria","Obando","Palmira","Pradera","Restrepo","Riofrío","Roldanillo","San Pedro","Sevilla","Toro","Trujillo","Tuluá","Ulloa","Versalles","Vijes","Yotoco","Yumbo","Zarzal"] },
 { "id": 30, "departamento": "Vaupés", "ciudades": ["Carurú","Mitú","Taraira"] },
 { "id": 31, "departamento": "Vichada", "ciudades": ["Cumaribo","La Primavera","Puerto Carreño","Santa Rosalía"] }
]
    """;
    // ===================================================================

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        createRegionalsIfNotExist();

        // Usuarios demo (opcional)
        createUserIfNotExists("gabriel@soy.sena.edu.co", "ayuda123", "Gabriel", "Desarrollador", "Tecnología", Role.USER);
        createUserIfNotExists("admin@soy.sena.edu.co", "admin123", "Admin", "Administrador", "Sistemas", Role.ADMIN);
        createUserIfNotExists("warehouse@soy.sena.edu.co", "wh123", "Warehouse", "Almacenista", "Logística", Role.WAREHOUSE);

        // Create inventories with owners and managers
        UserEntity gabriel = userRepository.findByEmail("gabriel@soy.sena.edu.co")
                .orElseThrow(() -> new IllegalStateException("Usuario demo 'gabriel' no creado"));
        UserEntity warehouse = userRepository.findByEmail("warehouse@soy.sena.edu.co")
                .orElseThrow(() -> new IllegalStateException("Usuario demo 'warehouse' no creado"));

        if (inventoryRepository.findByNameAndOwner("Inventory 1", gabriel).isEmpty()) {
            InventoryEntity inv1 = InventoryEntity.builder()
                    .uuid(UUID.randomUUID())
                    .name("Inventory 1")
                    .location("Location 1")
                    .owner(gabriel)
                    .managers(List.of(warehouse))
                    .build();
            inventoryRepository.save(inv1);
        }

        if (inventoryRepository.findByNameAndOwner("Inventory 2", gabriel).isEmpty()) {
            InventoryEntity inv2 = InventoryEntity.builder()
                    .uuid(UUID.randomUUID())
                    .name("Inventory 2")
                    .location("Location 2")
                    .owner(gabriel)
                    .managers(List.of(warehouse))
                    .build();
            inventoryRepository.save(inv2);
        }

        // Parsear el objeto (en el MISMO archivo)
        ObjectMapper om = new ObjectMapper();
        List<DeptWithCities> items = om.readValue(SEED, new TypeReference<List<DeptWithCities>>() {});

        // Sembrar departamentos y ciudades (idempotente, sin conteos globales)
        for (DeptWithCities item : items) {
            String depName = clean(item.getDepartamento());
            if (depName == null || depName.isBlank()) continue;

            // Asegura departamento (upsert por nombre)
            DepartamentEntity dep = ensureDepartament(depName);

            // Asegura ciudades (upsert por (nombre, departamento))
            if (item.getCiudades() == null) continue;
            for (String rawCity : item.getCiudades()) {
                String cityName = clean(rawCity);
                if (cityName == null || cityName.isBlank()) continue;

                ensureCity(cityName, dep);
            }
        }
    }

    private void createUserIfNotExists(String email, String password, String fullName,
                                       String jobTitle, String laborDepartment, Role role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            UserEntity user = UserEntity.builder()
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .fullName(fullName)
                    .jobTitle(jobTitle)
                    .laborDepartment(laborDepartment)
                    .role(role)
                    .status(true)
                    .imgUrl(null)
                    .build();

            userRepository.save(user);
            System.out.println("Created default user: " + email + " with role: " + role);
        }
    }

    // ------------------ Siembra de Regionals idempotente (por nombre, no por ID) ------------------

    private void createRegionalsIfNotExist() {
        // Se asegura que existan los departamentos requeridos antes (por nombre)
        ensureRegional("Amazonas", "R01", "Amazonas");
        ensureRegional("Antioquia", "R02", "Antioquia");
        ensureRegional("Arauca", "R03", "Arauca");
        ensureRegional("Atlántico", "R04", "Atlántico");
        ensureRegional("Bolívar", "R05", "Bolívar");
        ensureRegional("Boyacá", "R06", "Boyacá");
        ensureRegional("Caldas", "R07", "Caldas");
        ensureRegional("Caquetá", "R08", "Caquetá");
        ensureRegional("Casanare", "R09", "Casanare");
        ensureRegional("Cauca", "R10", "Cauca");
        ensureRegional("Cesar", "R11", "Cesar");
        ensureRegional("Chocó", "R12", "Chocó");
        ensureRegional("Córdoba", "R13", "Córdoba");
        ensureRegional("Cundinamarca", "R14", "Cundinamarca");
        ensureRegional("Guainía", "R15", "Guainía");
        ensureRegional("Guaviare", "R16", "Guaviare");
        ensureRegional("Huila", "R17", "Huila");
        ensureRegional("La Guajira", "R18", "La Guajira");
        ensureRegional("Magdalena", "R19", "Magdalena");
        ensureRegional("Meta", "R20", "Meta");
        ensureRegional("Nariño", "R21", "Nariño");
        ensureRegional("Norte de Santander", "R22", "Norte de Santander");
        ensureRegional("Putumayo", "R23", "Putumayo");
        ensureRegional("Quindío", "R24", "Quindío");
        ensureRegional("Risaralda", "R25", "Risaralda");
        ensureRegional("San Andrés y Providencia", "R26", "San Andrés y Providencia");
        ensureRegional("Santander", "R27", "Santander");
        ensureRegional("Sucre", "R28", "Sucre");
        ensureRegional("Tolima", "R29", "Tolima");
        ensureRegional("Valle del Cauca", "R30", "Valle del Cauca");
        ensureRegional("Vaupés", "R31", "Vaupés");
        ensureRegional("Vichada", "R32", "Vichada");
        // Bogotá como distrito (si así lo manejas) asociado al dpto Cundinamarca:
        ensureRegional("Distrito Capital", "R33", "Cundinamarca");
    }

    private RegionalEntity ensureRegional(String name, String regionalCode, String departamentName) {
        String cleanName = clean(name);
        String cleanCode = clean(regionalCode);
        String cleanDep = clean(departamentName);

        // Si ya existe por nombre o por código, retornar
        Optional<RegionalEntity> byName = regionalRepository.findAll().stream()
                .filter(r -> r.getName().equalsIgnoreCase(cleanName))
                .findFirst();
        if (byName.isPresent()) return byName.get();

        Optional<RegionalEntity> byCode = regionalRepository.findAll().stream()
                .filter(r -> r.getRegionalCode().equalsIgnoreCase(cleanCode))
                .findFirst();
        if (byCode.isPresent()) return byCode.get();

        // Asegurar que exista el departament (por nombre)
        DepartamentEntity dep = ensureDepartament(cleanDep);

        RegionalEntity regional = RegionalEntity.builder()
                .name(cleanName)
                .regionalCode(cleanCode)
                .departament(dep)
                .build();
        return regionalRepository.save(regional);
    }

    // ------------------ Helpers idempotentes para Departamentos y Ciudades ------------------

    private DepartamentEntity ensureDepartament(String depName) {
        String cleaned = clean(depName);
        if (cleaned == null || cleaned.isBlank()) {
            throw new IllegalArgumentException("Nombre de departamento vacío");
        }
        return departamentRepository.findByDepartamentIgnoreCase(cleaned)
                .orElseGet(() -> departamentRepository.save(
                        DepartamentEntity.builder().departament(cleaned).build()
                ));
    }

    private CityEntity ensureCity(String cityName, DepartamentEntity dep) {
        String cleaned = clean(cityName);
        if (cleaned == null || cleaned.isBlank()) {
            throw new IllegalArgumentException("Nombre de ciudad vacío");
        }
        return citiesRepository.findByCityIgnoreCaseAndDepartament(cleaned, dep)
                .orElseGet(() -> citiesRepository.save(
                        CityEntity.builder().city(cleaned).departament(dep).build()
                ));
    }

    private String clean(String s) {
        if (s == null) return null;
        String t = s.trim().replaceAll("\\s+", " ");
        return t.isEmpty() ? null : t;
    }

    // DTO interno para mapear el JSON embebido
    @lombok.Data
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class DeptWithCities {
        private String departamento;
        private List<String> ciudades;
    }
}


 */