const ellipsis = (value: string, numberOfCharacter: number) => {
    if (numberOfCharacter <= 0) {
        console.warn('You have to specify a number of characters strictly greater than 0');
        return value;
    }

    if (value.length <= numberOfCharacter) {
        return value;
    }

    return value.slice(0, numberOfCharacter) + '...';
}

export default ellipsis;