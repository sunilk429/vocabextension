import React, { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import axios from "axios";
// const definitionCache = {};
// const suggestionCache = {};
interface Definition {
  definition: string;
  synonyms: string[];
}

interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

interface WordData {
  word: string;
  phonetic: string;
  meanings: Meaning[];
}
interface WordScore {
  word: string;
  score: number;
}

export default function Component() {
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchData, setSearchData] = useState<WordData | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [suggestionData, setSuggestionData] = useState<WordScore[] | null>(
    null
  );
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] =
    useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionController = useRef<AbortController | null>(null);
  const definitionController = useRef<AbortController | null>(null);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    if (suggestionController.current) {
      suggestionController.current.abort();
    }
    if (e.target.value === "") {
      setSuggestionData(null);
    } else {
      await fetchSuggestions(e.target.value);
    }
    setSelectedSuggestionIndex(-1);
  };

  const handleSuggestionClick = async (word: string) => {
    setSearchInput(word);
    setSuggestionData(null);
    setSelectedSuggestionIndex(-1);
    await fetchDefinition(word);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchInput.trim() !== "") {
      setSuggestionData(null);
      await fetchDefinition(searchInput);
    }
  };

  const handleFocus = () => {
    if (searchInput.trim() !== "") {
      fetchSuggestions(searchInput);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestionData && suggestionData.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex((prevIndex) =>
          prevIndex < suggestionData.length - 1 ? prevIndex + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : suggestionData.length - 1
        );
      } else if (e.key === "Enter" && selectedSuggestionIndex !== -1) {
        handleSuggestionClick(suggestionData[selectedSuggestionIndex].word);
      }
    }
  };

  const fetchSuggestions = async (word: string) => {
    suggestionController.current = new AbortController();
    try {
      const { data } = await axios.get(
        `https://api.datamuse.com/sug?s=${word}`,
        { signal: suggestionController.current.signal }
      );
      const limitedData = data.slice(0, 5);
      setSuggestionData(limitedData);
    } catch (error) {
      console.log(error);
      setErrorStatus(null);
    }
  };

  const fetchDefinition = async (word: string) => {
    definitionController.current = new AbortController();

    try {
      const { data } = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
        { signal: definitionController.current.signal }
      );
      setSearchData(data[0]);
    } catch (error) {
      console.error("Error fetching definition:", error);
      setSearchData(null);
      setErrorStatus("Not Found 404");
    }
  };
  useEffect(() => {}, [errorStatus]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleBodyClick = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setSuggestionData(null);
      }
    };
    document.body.addEventListener("click", handleBodyClick);
    return () => {
      document.body.removeEventListener("click", handleBodyClick);
    };
  }, []);
  useEffect(() => {
    return () => {
      if (suggestionController.current) {
        suggestionController.current.abort();
      }
      if (definitionController.current) {
        definitionController.current.abort();
      }
    };
  }, []);
  return (
    <div key="1" className="w-80 h-80 mx-auto py-2 px-2 bg-white">
      <div />
      <div />
      <div className="relative mb-2">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between w-full rounded-3xl px-3 py-0 border-none bg-gray-100 ring-offset-background file:border-0 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1">
            <Input
              className="w-full px-3 py-2 border-none bg-gray-100"
              placeholder="Search..."
              type="text"
              onChange={handleInput}
              value={searchInput}
              ref={inputRef}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
            />
            <button type="submit">
              <SearchIcon width={18} height={18} />
            </button>
          </div>
        </form>
        {suggestionData && (
          <ul
            className="absolute
          mt-2 w-full bg-white rounded-b-lg shadow-lg z-30"
          >
            {suggestionData.map((item, index) => (
              <li
                key={index}
                className={`px-4 py-2 cursor-pointer ${
                  index === suggestionData.length - 1 ? "rounded-b-lg" : ""
                } ${selectedSuggestionIndex === index ? "bg-gray-100" : ""}`}
                onClick={() => handleSuggestionClick(item.word)}
                onMouseEnter={() => setSelectedSuggestionIndex(index)}
              >
                <div className="flex items-center gap-2">
                  <SearchIcon />
                  <span>{item.word}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {errorStatus && (
        <div className="flex justify-center items-center h-80">
          {errorStatus}
        </div>
      )}
      {searchData && (
        <ScrollArea className="pt-2 pb-6 pl-3 pr-6 bg-white">
          <div className="max-w-80 max-h-80">
            <div className="flex items-center space-x-3 mb-2">
              <VolumeIcon className="text-blue-600 h-6 w-6" />
              <h2 className="text-2xl font-bold">{searchData.word}</h2>
              <p className="text-gray-500">{searchData.phonetic}</p>
            </div>
            <div>
              {searchData.meanings.map((meaning, index) => (
                <div key={index}>
                  <p className="font-semibold">{meaning.partOfSpeech}</p>
                  <ol className="list-decimal ml-5">
                    {meaning.definitions.map((definition, idx) => (
                      <li key={idx} className="mb-2">
                        <p>{definition.definition}</p>
                        {definition.synonyms.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {definition.synonyms.map((synonym, idx) => (
                              <Badge key={idx} variant="secondary">
                                {synonym}
                              </Badge>
                            ))}
                            <ChevronDownIcon className="text-gray-400 h-5 w-5" />
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function VolumeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    </svg>
  );
}
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
