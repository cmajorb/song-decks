import CardImg from "src/components/CardImg";
import { CSSProperties, RefObject, useContext, useEffect, useState } from "react";
import HSwipe from "src/components/HSwipe";
import EndButtons from "src/components/EndButtons";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "notistack";
import axios from "axios";
import { MAIN_API } from "src/config";
import { PlayerCard } from "src/@types/types";
import { processTokens } from "src/utils/jwt";
import LoadingBackdrop from "../LoadingBackdrop";
import { Divider, Stack, Typography } from "@mui/material";
import { ActionButtons } from "./ActionButtons";
import { MetadataContext } from "src/contexts/MetadataContext";

// ----------------------------------------------------------------------

type GameContentProps = {
    isMobile: boolean;
    sectionRefs: {
        sectionRef1: RefObject<HTMLDivElement>;
        sectionRef2: RefObject<HTMLDivElement>;
        sectionRef3: RefObject<HTMLDivElement>;
        sectionRef4: RefObject<HTMLDivElement>;
    };
};

export default function GameContent({ isMobile, sectionRefs }: GameContentProps) {

    const { gameID = '' } = useParams();
    const { sectionRef1, sectionRef2, sectionRef3, sectionRef4 } = sectionRefs;
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const { setAllCards, inDeck, inHand, inPlay, inDiscard } = useContext(MetadataContext);

    const [awaitingResponse, setAwaitingResponse] = useState<boolean>(false);
    const [selectedCard, setSelectedCard] = useState<PlayerCard | null>(null);

    const div_style: CSSProperties = {
        height: isMobile ? '100vh' : '100vh',
        width: '100%',
        display: 'flex',
        scrollSnapStop: 'always',
        scrollSnapAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const getCards = async () => {
        setAwaitingResponse(true);
        let token = localStorage.getItem('accessToken') ?? '';
        await axios.get(`${MAIN_API.base_url}get_game_cards/${gameID}/`, { headers: { Authorization: `JWT ${token}` } }).then((response) => {
            if (response?.data && response.data.success) {
                const res = response.data.response;
                setAllCards(res);
            } else { enqueueSnackbar(response.data.response) };
            setAwaitingResponse(false);
        }).catch((error) => {
            console.error(error);
        })
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { processTokens(getCards) }, []);

    const drawCard = async () => {
        setAwaitingResponse(true);
        let token = localStorage.getItem('accessToken') ?? '';
        const formData = new FormData();
        formData.append('game_id', gameID);

        await axios.post(`${MAIN_API.base_url}handle_card_action/draw/`, formData, { headers: { Authorization: `JWT ${token}` } }).then((response) => {
            if (response?.data && response.data.success) {
                setAllCards(response.data.response);
                const new_card = response.data.new_card;
                enqueueSnackbar("Drew: " + new_card.card_template.card_name);
            } else { enqueueSnackbar(response.data.response) };
            setAwaitingResponse(false);
        }).catch((error) => {
            console.error(error);
        })
    };

    function processDrawCard() {
        if (inDeck.length > 0) { processTokens(drawCard) }
        else { enqueueSnackbar("No cards left in deck") };
    };

    function handleSelectCard(card: PlayerCard) {
        setSelectedCard(card);
        if (card) { enqueueSnackbar("Selected: " + card.card_template.card_name) };
    };

    return (
        <>
            { awaitingResponse && <LoadingBackdrop /> }
            { !awaitingResponse &&
                <>
                    { inDeck.length > 0 &&
                        <div style={div_style} ref={sectionRef1} id={"Deck"}>
                            <Stack spacing={2} justifyContent={'center'} alignItems={'center'} sx={{ width: '100%' }}>
                                {/* <GroupingHeader title={'Deck'} count={inDeck.length} /> */}

                                <HSwipe
                                    key={inDeck.length}
                                    isMobile={isMobile}
                                    cards={[
                                        <CardImg
                                            img_url={inDeck[0].card_template.img_url}
                                            card_name={'CARD BACK'}
                                            hide={true}
                                            onClickFunc={processDrawCard}
                                        />
                                    ]}
                                />
                            </Stack>
                        </div>
                    }
                    { inHand.length > 0 &&
                        <div style={div_style} ref={sectionRef2} id={"Hand"}>
                            <Stack spacing={2} justifyContent={'center'} alignItems={'center'} sx={{ width: '100%' }}>
                                {/* <GroupingHeader title={'Hand'} count={inHand.length} /> */}

                                <HSwipe
                                    key={inHand.length}
                                    isMobile={isMobile}
                                    cards={
                                        inHand.map((card: PlayerCard) => {
                                            return <CardImg
                                                    img_url={card.card_template.img_url}
                                                    card_name={card.card_template.card_name}
                                                    onClickFunc={() => handleSelectCard(card)}
                                                    buttonOptions={
                                                        <ActionButtons
                                                            category={'hand'}
                                                            selectedCard={selectedCard}
                                                            currentCard={card}
                                                            gameID={gameID}
                                                            setAllCards={setAllCards}
                                                            setAwaitingResponse={setAwaitingResponse}
                                                        />
                                                    }
                                                />
                                        })
                                    }
                                />
                            </Stack>
                        </div>
                    }
                    { inPlay.length > 0 &&
                        <div style={div_style} ref={sectionRef3} id={"In Play"}>
                            <Stack spacing={2} justifyContent={'center'} alignItems={'center'} sx={{ width: '100%' }}>
                                {/* <GroupingHeader title={'In Play'} count={inPlay.length} /> */}

                                <HSwipe
                                    key={inPlay.length}
                                    isMobile={isMobile}
                                    cards={
                                        inPlay.map((card: PlayerCard) => {
                                            return <CardImg
                                                    img_url={card.card_template.img_url}
                                                    card_name={card.card_template.card_name}
                                                    onClickFunc={() => handleSelectCard(card)}
                                                    buttonOptions={
                                                        <ActionButtons
                                                            category={'play'}
                                                            selectedCard={selectedCard}
                                                            currentCard={card}
                                                            gameID={gameID}
                                                            setAllCards={setAllCards}
                                                            setAwaitingResponse={setAwaitingResponse}
                                                        />
                                                    }
                                                />
                                        })
                                    }
                                />
                            </Stack>
                        </div>
                    }
                    { inDiscard.length > 0 &&
                        <div style={div_style} ref={sectionRef4} id={"Discard"}>
                            <Stack spacing={2} justifyContent={'center'} alignItems={'center'} sx={{ width: '100%' }}>
                                {/* <GroupingHeader title={'Discard'} count={inDiscard.length} /> */}

                                <HSwipe
                                    key={inDiscard.length}
                                    isMobile={isMobile}
                                    cards={
                                        inDiscard.map((card: PlayerCard) => {
                                            return <CardImg
                                                    img_url={card.card_template.img_url}
                                                    card_name={card.card_template.card_name}
                                                    onClickFunc={() => handleSelectCard(card)}
                                                    buttonOptions={
                                                        <ActionButtons
                                                            category={'discard'}
                                                            selectedCard={selectedCard}
                                                            currentCard={card}
                                                            gameID={gameID}
                                                            setAllCards={setAllCards}
                                                            setAwaitingResponse={setAwaitingResponse}
                                                        />
                                                    }
                                            />
                                        })
                                    }
                                />
                            </Stack>
                        </div>
                    }
                </>
            }

            <EndButtons gameID={gameID} />
        </>
    );
};

// ----------------------------------------------------------------------

type GroupingHeaderProps = {
    title: string;
    count: number;
};

export function GroupingHeader({ title, count }: GroupingHeaderProps) {
    return (
        // <Stack justifyContent={'center'} alignItems={'center'} sx={{ width: '15%' }}>
        //     <Typography variant={'body1'} sx={{ whiteSpace: 'nowrap' }}>{title}</Typography>
        //     <Divider flexItem orientation={'horizontal'} />
        //     <Typography variant={'body1'}>{count}</Typography>
        // </Stack>
        <Typography variant={'body1'}>{title} ({count})</Typography>
    );
};