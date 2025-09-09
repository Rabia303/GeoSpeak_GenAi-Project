from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from gtts import gTTS
import json
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import io
import tempfile

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"])

# Complete categories with all data
categories = [
    {"id": "greetings", "name": "Greetings", "icon": "FaHandPeace"},
    {"id": "food", "name": "Food & Dining", "icon": "FaUtensils"},
    {"id": "transportation", "name": "Transportation", "icon": "FaCar"},
    {"id": "shopping", "name": "Shopping", "icon": "FaShoppingCart"},
    {"id": "emergency", "name": "Emergency", "icon": "FaFirstAid"},
    {"id": "directions", "name": "Directions", "icon": "FaCompass"},
    {"id": "accommodation", "name": "Accommodation", "icon": "FaHotel"},
    {"id": "numbers", "name": "Numbers", "icon": "FaSortNumericDown"}
]

# Complete phrases for all categories
phrases = {
    "greetings": [
        {"id": 1, "english": "Hello", "translation": "Hola", "pronunciation": "OH-lah"},
        {"id": 2, "english": "Good morning", "translation": "Buenos días", "pronunciation": "BWEH-nos DEE-as"},
        {"id": 3, "english": "Good afternoon", "translation": "Buenas tardes", "pronunciation": "BWEH-nas TAR-des"},
        {"id": 4, "english": "Good evening", "translation": "Buenas noches", "pronunciation": "BWEH-nas NO-ches"},
        {"id": 5, "english": "How are you?", "translation": "¿Cómo estás?", "pronunciation": "KOH-mo es-TAS"},
        {"id": 6, "english": "I'm fine, thank you", "translation": "Estoy bien, gracias", "pronunciation": "es-TOY byen, GRA-syas"},
        {"id": 7, "english": "What's your name?", "translation": "¿Cómo te llamas?", "pronunciation": "KOH-mo te YAH-mas"},
        {"id": 8, "english": "My name is...", "translation": "Me llamo...", "pronunciation": "meh YAH-mo"},
        {"id": 9, "english": "Nice to meet you", "translation": "Mucho gusto", "pronunciation": "MOO-cho GOOS-to"},
        {"id": 10, "english": "Goodbye", "translation": "Adiós", "pronunciation": "a-DYOS"},
        {"id": 11, "english": "See you later", "translation": "Hasta luego", "pronunciation": "AS-ta LWE-go"},
        {"id": 12, "english": "See you tomorrow", "translation": "Hasta mañana", "pronunciation": "AS-ta ma-NYA-na"},
        {"id": 13, "english": "Please", "translation": "Por favor", "pronunciation": "por fa-VOR"},
        {"id": 14, "english": "Thank you", "translation": "Gracias", "pronunciation": "GRA-syas"},
        {"id": 15, "english": "You're welcome", "translation": "De nada", "pronunciation": "de NA-da"},
        {"id": 16, "english": "Excuse me", "translation": "Disculpe", "pronunciation": "dis-KOOL-pe"},
        {"id": 17, "english": "I'm sorry", "translation": "Lo siento", "pronunciation": "lo SYEN-to"},
        {"id": 18, "english": "Yes", "translation": "Sí", "pronunciation": "see"},
        {"id": 19, "english": "No", "translation": "No", "pronunciation": "no"},
        {"id": 20, "english": "Maybe", "translation": "Quizás", "pronunciation": "kee-SAS"}
    ],
    "food": [
        {"id": 21, "english": "I would like to order", "translation": "Me gustaría ordenar", "pronunciation": "meh goos-ta-REE-ah or-den-AR"},
        {"id": 22, "english": "The menu, please", "translation": "El menú, por favor", "pronunciation": "el meh-NOO por fa-VOR"},
        {"id": 23, "english": "What do you recommend?", "translation": "¿Qué recomienda?", "pronunciation": "keh reh-koh-MYEN-da"},
        {"id": 24, "english": "I am vegetarian", "translation": "Soy vegetariano/a", "pronunciation": "soy veh-he-ta-RYAH-no/na"},
        {"id": 25, "english": "I am vegan", "translation": "Soy vegano/a", "pronunciation": "soy ve-GA-no/na"},
        {"id": 26, "english": "I have food allergies", "translation": "Tengo alergias alimentarias", "pronunciation": "TEN-go a-LER-hyas a-li-men-TA-ryas"},
        {"id": 27, "english": "Cheers!", "translation": "¡Salud!", "pronunciation": "sa-LOOD"},
        {"id": 28, "english": "The bill, please", "translation": "La cuenta, por favor", "pronunciation": "la KWEN-ta por fa-VOR"},
        {"id": 29, "english": "Is service included?", "translation": "¿El servicio está incluido?", "pronunciation": "el ser-VEE-syo es-ta in-kloo-EE-do"},
        {"id": 30, "english": "This is delicious", "translation": "Esto está delicioso", "pronunciation": "ES-to es-ta de-li-SYO-so"},
        {"id": 31, "english": "I would like water", "translation": "Quisiera agua", "pronunciation": "ki-SYE-ra A-gwa"},
        {"id": 32, "english": "A table for two, please", "translation": "Una mesa para dos, por favor", "pronunciation": "OO-na ME-sa PA-ra dos por fa-VOR"},
        {"id": 33, "english": "Do you have vegan options?", "translation": "¿Tienen opciones veganas?", "pronunciation": "TYE-nen op-SYO-nes ve-GA-nas"},
        {"id": 34, "english": "Could I have the wine list?", "translation": "¿Podría ver la carta de vinos?", "pronunciation": "po-DREE-a ver la CAR-ta de VEE-nos"},
        {"id": 35, "english": "I'll have the same", "translation": "Voy a tomar lo mismo", "pronunciation": "voy a to-MAR lo MEES-mo"},
        {"id": 36, "english": "Is this dish spicy?", "translation": "¿Este plato es picante?", "pronunciation": "ES-te PLA-to es pi-KAN-te"},
        {"id": 37, "english": "Could I have more bread?", "translation": "¿Podría traer más pan?", "pronunciation": "po-DREE-a tra-ER mas PAN"},
        {"id": 38, "english": "I'm full", "translation": "Estoy lleno", "pronunciation": "es-TOY YE-no"},
        {"id": 39, "english": "This isn't what I ordered", "translation": "Esto no es lo que pedí", "pronunciation": "ES-to no es lo ke pe-DEE"},
        {"id": 40, "english": "Could I have a doggy bag?", "translation": "¿Podría llevarme lo que sobra?", "pronunciation": "po-DREE-a ye-VAR-me lo ke SO-bra"}
    ],
    "transportation": [
        {"id": 41, "english": "Where is the bus stop?", "translation": "¿Dónde está la parada de autobús?", "pronunciation": "DON-deh es-TA la pa-RA-da de ow-to-BOOS"},
        {"id": 42, "english": "How much is a ticket?", "translation": "¿Cuánto cuesta un boleto?", "pronunciation": "KWAN-to KWES-ta oon bo-LE-to"},
        {"id": 43, "english": "I need a taxi", "translation": "Necesito un taxi", "pronunciation": "ne-se-SEE-to oon TAK-see"},
        {"id": 44, "english": "To the airport, please", "translation": "Al aeropuerto, por favor", "pronunciation": "al a-e-ro-PWER-to por fa-VOR"},
        {"id": 45, "english": "To the train station", "translation": "A la estación de tren", "pronunciation": "a la es-ta-SYON de TREN"},
        {"id": 46, "english": "How long does it take?", "translation": "¿Cuánto tiempo se tarda?", "pronunciation": "KWAN-to TYEM-po se TAR-da"},
        {"id": 47, "english": "Is this seat taken?", "translation": "¿Está ocupado este asiento?", "pronunciation": "es-TA o-koo-PA-do ES-te a-SYEN-to"},
        {"id": 48, "english": "Which platform for the train to...?", "translation": "¿Qué andén para el tren a...?", "pronunciation": "ke an-DEN PA-ra el tren a"},
        {"id": 49, "english": "I'd like to rent a car", "translation": "Me gustaría alquilar un coche", "pronunciation": "me goos-ta-REE-a al-ki-LAR oon KO-che"},
        {"id": 50, "english": "Where can I get a taxi?", "translation": "¿Dónde puedo tomar un taxi?", "pronunciation": "DON-de PWE-do to-MAR oon TAK-see"},
        {"id": 51, "english": "Does this bus go to...?", "translation": "¿Este autobús va a...?", "pronunciation": "ES-te ow-to-BOOS va a"},
        {"id": 52, "english": "When is the next bus?", "translation": "¿Cuándo es el próximo autobús?", "pronunciation": "KWAN-do es el PROK-see-mo ow-to-BOOS"},
        {"id": 53, "english": "I need directions to...", "translation": "Necesito direcciones para llegar a...", "pronunciation": "ne-se-SEE-to di-rek-SYO-nes PA-ra ye-GAR a"},
        {"id": 54, "english": "How much is the fare?", "translation": "¿Cuánto cuesta el pasaje?", "pronunciation": "KWAN-to KWES-ta el pa-SA-he"},
        {"id": 55, "english": "Is there a direct bus?", "translation": "¿Hay un autobús directo?", "pronunciation": "ai oon ow-to-BOOS di-REK-to"},
        {"id": 56, "english": "I'm getting off at the next stop", "translation": "Me bajo en la próxima parada", "pronunciation": "me BA-ho en la PROK-see-ma pa-RA-da"},
        {"id": 57, "english": "Could you let me know when we arrive?", "translation": "¿Podría avisarme cuando lleguemos?", "pronunciation": "po-DREE-a a-vee-SAR-me KWAN-do ye-GE-mos"},
        {"id": 58, "english": "Where is the nearest metro station?", "translation": "¿Dónde está la estación de metro más cercana?", "pronunciation": "DON-de es-TA la es-ta-SYON de ME-tro mas ser-KA-na"},
        {"id": 59, "english": "I'm lost", "translation": "Estoy perdido", "pronunciation": "es-TOY per-DEE-do"},
        {"id": 60, "english": "Can you show me on the map?", "translation": "¿Puede mostrarme en el mapa?", "pronunciation": "PWE-de mos-TRAR-me en el MA-pa"}
    ],
    "shopping": [
        {"id": 61, "english": "How much does this cost?", "translation": "¿Cuánto cuesta esto?", "pronunciation": "KWAN-to KWES-ta ES-to"},
        {"id": 62, "english": "Do you accept credit cards?", "translation": "¿Aceptan tarjetas de crédito?", "pronunciation": "a-SEP-tan tar-HE-tas de CRE-di-to"},
        {"id": 63, "english": "I'm just looking", "translation": "Solo estoy mirando", "pronunciation": "SO-lo es-TOY mee-RAN-do"},
        {"id": 64, "english": "Can I try this on?", "translation": "¿Puedo probarme esto?", "pronunciation": "PWE-do pro-BAR-me ES-to"},
        {"id": 65, "english": "Where are the changing rooms?", "translation": "¿Dónde están los probadores?", "pronunciation": "DON-de es-TAN los pro-ba-DO-res"},
        {"id": 66, "english": "Do you have this in a different size?", "translation": "¿Tiene esto en otra talla?", "pronunciation": "TYE-ne ES-to en O-tra TA-ya"},
        {"id": 67, "english": "Do you have this in another color?", "translation": "¿Tiene esto en otro color?", "pronunciation": "TYE-ne ES-to en O-tra ko-LOR"},
        {"id": 68, "english": "It's too expensive", "translation": "Es demasiado caro", "pronunciation": "es de-ma-SYA-do KA-ro"},
        {"id": 69, "english": "Is there a discount?", "translation": "¿Hay descuento?", "pronunciation": "ai des-KWEN-to"},
        {"id": 70, "english": "Can you give me a better price?", "translation": "¿Puede hacerme un mejor precio?", "pronunciation": "PWE-de a-SER-me oon me-HOR pre-SYO"},
        {"id": 71, "english": "I'll take it", "translation": "Me lo llevo", "pronunciation": "me lo YE-vo"},
        {"id": 72, "english": "Do you have a bag?", "translation": "¿Tiene una bolsa?", "pronunciation": "TYE-ne OO-na BOL-sa"},
        {"id": 73, "english": "Where do I pay?", "translation": "¿Dónde pago?", "pronunciation": "DON-de PA-go"},
        {"id": 74, "english": "Can I get a receipt?", "translation": "¿Puedo tener un recibo?", "pronunciation": "PWE-do te-NER oon re-SEE-bo"},
        {"id": 75, "english": "Do you have a warranty?", "translation": "¿Tiene garantía?", "pronunciation": "TYE-ne ga-ran-TEE-a"},
        {"id": 76, "english": "I'm looking for a gift", "translation": "Estoy buscando un regalo", "pronunciation": "es-TOY boos-KAN-do oon re-GA-lo"},
        {"id": 77, "english": "What's your return policy?", "translation": "¿Cuál es su política de devoluciones?", "pronunciation": "KWAL es soo po-LEE-tee-ka de de-vo-loo-SYO-nes"},
        {"id": 78, "english": "Do you have something cheaper?", "translation": "¿Tiene algo más barato?", "pronunciation": "TYE-ne AL-go mas ba-RA-to"},
        {"id": 79, "english": "This is a present", "translation": "Esto es un regalo", "pronunciation": "ES-to es oon re-GA-lo"},
        {"id": 80, "english": "Can you gift wrap it?", "translation": "¿Puede envolverlo para regalo?", "pronunciation": "PWE-de en-vol-VER-lo PA-ra re-GA-lo"}
    ],
    "emergency": [
        {"id": 81, "english": "Help!", "translation": "¡Ayuda!", "pronunciation": "ah-YOO-da"},
        {"id": 82, "english": "I need a doctor", "translation": "Necesito un médico", "pronunciation": "neh-seh-SEE-to oon MEH-dee-ko"},
        {"id": 83, "english": "Call the police", "translation": "Llame a la policía", "pronunciation": "YAH-meh a la po-lee-SEE-ah"},
        {"id": 84, "english": "Where is the hospital?", "translation": "¿Dónde está el hospital?", "pronunciation": "DON-deh es-TA el os-pee-TAL"},
        {"id": 85, "english": "I am lost", "translation": "Estoy perdido/a", "pronunciation": "es-TOY per-DEE-do/da"},
        {"id": 86, "english": "I've been robbed", "translation": "Me han robado", "pronunciation": "me an ro-BA-do"},
        {"id": 87, "english": "My wallet was stolen", "translation": "Me robaron la cartera", "pronunciation": "me ro-BA-ron la kar-TE-ra"},
        {"id": 88, "english": "I need help", "translation": "Necesito ayuda", "pronunciation": "ne-se-SEE-to a-YOO-da"},
        {"id": 89, "english": "It's an emergency", "translation": "Es una emergencia", "pronunciation": "es OO-na e-mer-HEN-sya"},
        {"id": 90, "english": "Call an ambulance", "translation": "Llame una ambulancia", "pronunciation": "YA-me OO-na am-boo-LAN-sya"},
        {"id": 91, "english": "There's been an accident", "translation": "Ha habido un accidente", "pronunciation": "a a-BEE-do oon ak-see-DEN-te"},
        {"id": 92, "english": "I'm not feeling well", "translation": "No me siento bien", "pronunciation": "no me SYEN-to byen"},
        {"id": 93, "english": "Where is the pharmacy?", "translation": "¿Dónde está la farmacia?", "pronunciation": "DON-de es-TA la far-MA-sya"},
        {"id": 94, "english": "I'm allergic to...", "translation": "Soy alérgico/a a...", "pronunciation": "soy a-LER-hee-ko/a a"},
        {"id": 95, "english": "I need to contact my embassy", "translation": "Necesito contactar con mi embajada", "pronunciation": "ne-se-SEE-to kon-tak-TAR kon mi em-ba-HA-da"},
        {"id": 96, "english": "Fire!", "translation": "¡Fuego!", "pronunciation": "FWE-go"},
        {"id": 97, "english": "Be careful!", "translation": "¡Cuidado!", "pronunciation": "kwee-DA-do"},
        {"id": 98, "english": "Watch out!", "translation": "¡Atención!", "pronunciation": "a-ten-SYON"},
        {"id": 99, "english": "Is it safe here?", "translation": "¿Es seguro aquí?", "pronunciation": "es se-GU-ro a-KEE"},
        {"id": 100, "english": "I need to report a crime", "translation": "Necesito reportar un crimen", "pronunciation": "ne-se-SEE-to re-por-TAR oon KREE-men"}
    ],
    "directions": [
        {"id": 101, "english": "Where is...?", "translation": "¿Dónde está...?", "pronunciation": "DON-deh es-TA"},
        {"id": 102, "english": "How do I get to...?", "translation": "¿Cómo llego a...?", "pronunciation": "KO-mo YE-go a"},
        {"id": 103, "english": "Turn left", "translation": "Gire a la izquierda", "pronunciation": "HEE-re a la ees-KYER-da"},
        {"id": 104, "english": "Turn right", "translation": "Gire a la derecha", "pronunciation": "HEE-re a la de-RE-cha"},
        {"id": 105, "english": "Go straight", "translation": "Siga derecho", "pronunciation": "SEE-ga de-RE-cho"},
        {"id": 106, "english": "It's nearby", "translation": "Está cerca", "pronunciation": "es-TA SER-ka"},
        {"id": 107, "english": "It's far", "translation": "Está lejos", "pronunciation": "es-TA LE-hos"},
        {"id": 108, "english": "North", "translation": "Norte", "pronunciation": "NOR-te"},
        {"id": 109, "english": "South", "translation": "Sur", "pronunciation": "soor"},
        {"id": 110, "english": "East", "translation": "Este", "pronunciation": "ES-te"},
        {"id": 111, "english": "West", "translation": "Oeste", "pronunciation": "o-ES-te"},
        {"id": 112, "english": "On the corner", "translation": "En la esquina", "pronunciation": "en la es-KEE-na"},
        {"id": 113, "english": "Next to", "translation": "Junto a", "pronunciation": "HOON-to a"},
        {"id": 114, "english": "Behind", "translation": "Detrás de", "pronunciation": "de-TRAS de"},
        {"id": 115, "english": "In front of", "translation": "En frente de", "pronunciation": "en FREN-te de"},
        {"id": 116, "english": "Between", "translation": "Entre", "pronunciation": "EN-tre"},
        {"id": 117, "english": "Across from", "translation": "Frente a", "pronunciation": "FREN-te a"},
        {"id": 118, "english": "At the traffic light", "translation": "En el semáforo", "pronunciation": "en el se-MA-fo-ro"},
        {"id": 119, "english": "At the roundabout", "translation": "En la rotonda", "pronunciation": "en la ro-TON-da"},
        {"id": 120, "english": "Can you show me on the map?", "translation": "¿Puede mostrarme en el mapa?", "pronunciation": "PWE-de mos-TRAR-me en el MA-pa"}
    ],
    "accommodation": [
        {"id": 121, "english": "I have a reservation", "translation": "Tengo una reservación", "pronunciation": "TEN-go oo-na re-ser-va-SYON"},
        {"id": 122, "english": "Do you have any rooms available?", "translation": "¿Tienen habitaciones disponibles?", "pronunciation": "TYE-nen a-bee-ta-SYO-nes dis-po-nee-BLES"},
        {"id": 123, "english": "What time is check-out?", "translation": "¿A qué hora es la salida?", "pronunciation": "a ke O-ra es la sa-LEE-da"},
        {"id": 124, "english": "The key, please", "translation": "La llave, por favor", "pronunciation": "la YA-ve por fa-VOR"},
        {"id": 125, "english": "I'd like a single room", "translation": "Me gustaría una habitación individual", "pronunciation": "me goos-ta-REE-a OO-na a-bee-ta-SYON in-dee-vee-dwal"},
        {"id": 126, "english": "I'd like a double room", "translation": "Me gustaría una habitación doble", "pronunciation": "me goos-ta-REE-a OO-na a-bee-ta-SYON DO-ble"},
        {"id": 127, "english": "Does the room have a bathroom?", "translation": "¿La habitación tiene baño?", "pronunciation": "la a-bee-ta-SYON TYE-ne BA-nyo"},
        {"id": 128, "english": "Is breakfast included?", "translation": "¿El desayuno está incluido?", "pronunciation": "el de-sa-YOO-no es-ta in-kloo-EE-do"},
        {"id": 129, "english": "What time is breakfast served?", "translation": "¿A qué hora se sirve el desayuno?", "pronunciation": "a ke O-ra se SER-ve el de-sa-YOO-no"},
        {"id": 130, "english": "I need extra towels", "translation": "Necesito toallas adicionales", "pronunciation": "ne-se-SEE-to to-A-yas a-dee-syo-NA-les"},
        {"id": 131, "english": "The room is too hot/cold", "translation": "La habitación está muy caliente/fría", "pronunciation": "la a-bee-ta-SYON es-TA MOOY ka-LYEN-te/FREE-a"},
        {"id": 132, "english": "There's a problem with the...", "translation": "Hay un problema con...", "pronunciation": "ai oon pro-BLE-ma kon"},
        {"id": 133, "english": "Can I have a wake-up call?", "translation": "¿Pueden despertarme por teléfono?", "pronunciation": "PWE-den des-per-TAR-me por te-LE-fo-no"},
        {"id": 134, "english": "Where is the elevator?", "translation": "¿Dónde está el ascensor?", "pronunciation": "DON-de es-TA el as-sen-SOR"},
        {"id": 135, "english": "Do you have Wi-Fi?", "translation": "¿Tienen Wi-Fi?", "pronunciation": "TYE-nen WAI-FAI"},
        {"id": 136, "english": "What's the Wi-Fi password?", "translation": "¿Cuál es la contraseña del Wi-Fi?", "pronunciation": "KWAL es la kon-tra-SE-nya del WAI-FAI"},
        {"id": 137, "english": "I'd like to extend my stay", "translation": "Me gustaría extender mi estadía", "pronunciation": "me goos-ta-REE-a eks-ten-DER me es-ta-DEE-a"},
        {"id": 138, "english": "I'm checking out today", "translation": "Me voy hoy", "pronunciation": "me VOY oy"},
        {"id": 139, "english": "Can I store my luggage?", "translation": "¿Puedo guardar mi equipaje?", "pronunciation": "PWE-do gwar-DAR me e-kee-PA-he"},
        {"id": 140, "english": "Where is the nearest ATM?", "translation": "¿Dónde está el cajero automático más cercano?", "pronunciation": "DON-de es-TA el ka-HE-ro ow-to-MA-tee-ko mas ser-KA-no"}
    ],
    "numbers": [
        {"id": 141, "english": "One", "translation": "Uno", "pronunciation": "OO-no"},
        {"id": 142, "english": "Two", "translation": "Dos", "pronunciation": "DOS"},
        {"id": 143, "english": "Three", "translation": "Tres", "pronunciation": "TRES"},
        {"id": 144, "english": "Four", "translation": "Cuatro", "pronunciation": "KWA-tro"},
        {"id": 145, "english": "Five", "translation": "Cinco", "pronunciation": "SIN-ko"},
        {"id": 146, "english": "Six", "translation": "Seis", "pronunciation": "SEIS"},
        {"id": 147, "english": "Seven", "translation": "Siete", "pronunciation": "SYE-te"},
        {"id": 148, "english": "Eight", "translation": "Ocho", "pronunciation": "O-cho"},
        {"id": 149, "english": "Nine", "translation": "Nueve", "pronunciation": "NWE-ve"},
        {"id": 150, "english": "Ten", "translation": "Diez", "pronunciation": "DYESS"},
        {"id": 151, "english": "Eleven", "translation": "Once", "pronunciation": "ON-se"},
        {"id": 152, "english": "Twelve", "translation": "Doce", "pronunciation": "DO-se"},
        {"id": 153, "english": "Thirteen", "translation": "Trece", "pronunciation": "TRE-se"},
        {"id": 154, "english": "Fourteen", "translation": "Catorce", "pronunciation": "ka-TOR-se"},
        {"id": 155, "english": "Fifteen", "translation": "Quince", "pronunciation": "KEEN-se"},
        {"id": 156, "english": "Sixteen", "translation": "Dieciséis", "pronunciation": "dye-see-SEIS"},
        {"id": 157, "english": "Seventeen", "translation": "Diecisiete", "pronunciation": "dye-see-SYE-te"},
        {"id": 158, "english": "Eighteen", "translation": "Dieciocho", "pronunciation": "dye-see-O-cho"},
        {"id": 159, "english": "Nineteen", "translation": "Diecinueve", "pronunciation": "dye-see-NWE-ve"},
        {"id": 160, "english": "Twenty", "translation": "Veinte", "pronunciation": "VEIN-te"},
        {"id": 161, "english": "Thirty", "translation": "Treinta", "pronunciation": "TREIN-ta"},
        {"id": 162, "english": "Forty", "translation": "Cuarenta", "pronunciation": "kwa-REN-ta"},
        {"id": 163, "english": "Fifty", "translation": "Cincuenta", "pronunciation": "sin-KWEN-ta"},
        {"id": 164, "english": "Sixty", "translation": "Sesenta", "pronunciation": "se-SEN-ta"},
        {"id": 165, "english": "Seventy", "translation": "Setenta", "pronunciation": "se-TEN-ta"},
        {"id": 166, "english": "Eighty", "translation": "Ochenta", "pronunciation": "o-CHEN-ta"},
        {"id": 167, "english": "Ninety", "translation": "Noventa", "pronunciation": "no-VEN-ta"},
        {"id": 168, "english": "One hundred", "translation": "Cien", "pronunciation": "SYEN"},
        {"id": 169, "english": "One thousand", "translation": "Mil", "pronunciation": "MEEL"},
        {"id": 170, "english": "Million", "translation": "Millón", "pronunciation": "mee-YON"}
    ]
}

practice_questions = [
    {
        "question": "How would you say \"Hello\" in Spanish?",
        "options": ["Hola", "Adiós", "Gracias"],
        "correctAnswer": 0
    },
    {
        "question": "How would you say \"Thank you\" in Japanese?",
        "options": ["Konnichiwa", "Arigato", "Sayonara"],
        "correctAnswer": 1
    },
    {
        "question": "How would you say \"Good morning\" in French?",
        "options": ["Bonsoir", "Bonjour", "Bonne nuit"],
        "correctAnswer": 1
    }
]

# In-memory storage for favorites (in a real app, use a database)
favorites = []

@app.route('/api/categories', methods=['GET'])
def get_categories():
    return jsonify(categories)

@app.route('/api/phrases', methods=['GET'])
def get_phrases():
    return jsonify(phrases)

@app.route('/api/practice-questions', methods=['GET'])
def get_practice_questions():
    return jsonify(practice_questions)

@app.route('/api/favorites', methods=['GET', 'POST'])
def handle_favorites():
    if request.method == 'GET':
        return jsonify(favorites)
    
    if request.method == 'POST':
        data = request.get_json()
        phrase_id = data.get('phraseId')
        
        if phrase_id in favorites:
            favorites.remove(phrase_id)
        else:
            favorites.append(phrase_id)
            
        return jsonify(favorites)

@app.route('/api/audio', methods=['POST'])
def generate_audio():
    data = request.get_json()
    text = data.get('text', '')
    language = data.get('language', 'es')
    
    try:
        # Language code mapping
        lang_map = {
            'es': 'es',  # Spanish
            'fr': 'fr',  # French
            'de': 'de',  # German
            'ja': 'ja',  # Japanese
            'zh': 'zh-CN',  # Chinese
            'ar': 'ar',  # Arabic
            'ru': 'ru',  # Russian
            'en': 'en'   # English
        }
        
        lang_code = lang_map.get(language, 'es')
        tts = gTTS(text=text, lang=lang_code, slow=False)
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
            tts.save(tmp_file.name)
            tmp_file.flush()
            
            return send_file(
                tmp_file.name,
                mimetype='audio/mpeg',
                as_attachment=False,
                download_name='audio.mp3'
            )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/download', methods=['POST'])
def download_phrases():
    data = request.get_json()
    language = data.get('language', 'es')
    
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Add title
        title = Paragraph(f"Phrasebook - {language.upper()}", styles['Title'])
        story.append(title)
        story.append(Spacer(1, 12))
        
        # Add phrases by category
        for category_id, phrase_list in phrases.items():
            category_name = next((cat['name'] for cat in categories if cat['id'] == category_id), category_id)
            category_header = Paragraph(category_name, styles['Heading2'])
            story.append(category_header)
            story.append(Spacer(1, 6))
            
            for phrase in phrase_list:
                phrase_text = f"<b>{phrase['english']}</b>: {phrase['translation']} ({phrase['pronunciation']})"
                story.append(Paragraph(phrase_text, styles['BodyText']))
                story.append(Spacer(1, 3))
            
            story.append(Spacer(1, 12))
        
        doc.build(story)
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'{language}_phrasebook.pdf'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "OK",
        "message": "Phrasebook API is running"
    })

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Phrasebook API is running"})

if __name__ == '__main__':
    app.run(debug=True, port=5002, host='0.0.0.0')